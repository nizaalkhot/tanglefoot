import os
import json
from typing import Dict, Any
from benchmark.frameworks.llm_loader import get_llm, MockChatModel

def fallback_judge(task_desc: str, agent_output: str, golden_reference: str) -> Dict[str, Any]:
    """
    High-fidelity semantic fallback using keyword validation and token matching
    when live LLMs or keys are not available.
    """
    agent_lower = agent_output.lower()
    ref_lower = golden_reference.lower()
    
    # Strip basic punctuation and split
    clean_words = []
    for w in ref_lower.split():
        clean = w.strip(",.?!\"';:-()[]{}").lower()
        if len(clean) > 2:
            clean_words.append(clean)
            
    # Deduplicate keys
    keywords = list(set(clean_words))
    
    if not keywords:
        return {
            "completeness": 100.0,
            "resilience": 100.0,
            "explanation": "No golden reference words to match. Defaulting to success."
        }
        
    matched = [k for k in keywords if k in agent_lower]
    completeness = (len(matched) / len(keywords)) * 100.0
    
    # Boost if exact matches of specific entities (like names or dollar values) are present
    exact_phrases = [p.strip() for p in golden_reference.split(",") if len(p.strip()) > 3]
    exact_matches = [ep for ep in exact_phrases if ep.lower() in agent_lower]
    if exact_matches:
        completeness = max(completeness, 75.0)
        if len(exact_matches) == len(exact_phrases):
            completeness = 100.0
            
    completeness = min(100.0, max(0.0, completeness))
    
    return {
        "completeness": completeness,
        "resilience": 100.0,
        "explanation": f"Offline local keyword match logic. Matched {len(matched)} of {len(keywords)} reference keywords."
    }

def llm_judge(task_desc: str, agent_output: str, golden_reference: str) -> Dict[str, Any]:
    """
    Lightweight semantic LLM-as-a-judge. Queries an active LLM if available,
    falling back to keyword/token-matching mathematics offline.
    """
    # Select appropriate provider based on active environment keys
    provider = "openai"
    if "GROQ_API_KEY" in os.environ:
        provider = "groq"
    elif "OLLAMA_HOST" in os.environ:
        provider = "ollama"
        
    try:
        model = get_llm(provider=provider)
        if isinstance(model, MockChatModel):
            return fallback_judge(task_desc, agent_output, golden_reference)
            
        prompt = f"""
        You are an objective AI evaluator grading an LLM agent's output against a golden reference.
        
        Task Description: {task_desc}
        Golden Reference: {golden_reference}
        Agent Output: {agent_output}
        
        Evaluate the completeness and accuracy of the Agent Output relative to the Golden Reference.
        Respond ONLY with a valid JSON object in the following format:
        {{
            "completeness": <percentage score between 0 and 100 as a float>,
            "resilience": <percentage score between 0 and 100 as a float, set to 100 by default unless there is a clear formatting breakdown>,
            "explanation": "<brief single-sentence justification>"
        }}
        Do not include any markdown formatting or extra text outside the JSON block.
        """
        
        response = model.invoke(prompt)
        content = response.content.strip()
        
        # Clean any possible markdown codeblock wraps
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].strip()
            
        data = json.loads(content)
        return {
            "completeness": float(data.get("completeness", 0.0)),
            "resilience": float(data.get("resilience", 100.0)),
            "explanation": str(data.get("explanation", "Parsed via active semantic LLM-as-a-Judge."))
        }
    except Exception as e:
        # Graceful fallback to prevent crashes
        return fallback_judge(task_desc, agent_output, golden_reference)
