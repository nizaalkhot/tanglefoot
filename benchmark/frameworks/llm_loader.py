import os
from typing import Any

class OllamaChatClient:
    """
    Dependency-free native client to interact with local Ollama chat endpoints.
    Behaves like a LangChain Chat Model interface (exposes .invoke() returning a response with .content).
    """
    def __init__(self, model_name: str = None, base_url: str = None):
        self.model_name = model_name or os.getenv("OLLAMA_MODEL", "gemma3:latest")
        self.base_url = base_url or os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")

    def invoke(self, messages: Any) -> Any:
        import requests
        
        # Format messages into Ollama chat API format
        formatted_messages = []
        if isinstance(messages, str):
            formatted_messages.append({"role": "user", "content": messages})
        elif isinstance(messages, list):
            for msg in messages:
                if isinstance(msg, dict):
                    formatted_messages.append(msg)
                elif hasattr(msg, "content"):
                    role = "user"
                    if hasattr(msg, "type"):
                        role = "system" if msg.type == "system" else "assistant" if msg.type == "assistant" else "user"
                    formatted_messages.append({"role": role, "content": msg.content})
                elif isinstance(msg, tuple) and len(msg) == 2:
                    formatted_messages.append({"role": msg[0], "content": msg[1]})
                else:
                    formatted_messages.append({"role": "user", "content": str(msg)})
        else:
            formatted_messages.append({"role": "user", "content": str(messages)})

        url = f"{self.base_url}/api/chat"
        payload = {
            "model": self.model_name,
            "messages": formatted_messages,
            "stream": False,
            "options": {
                "temperature": 0.0  # Force deterministic tool use
            }
        }
        
        try:
            res = requests.post(url, json=payload, timeout=300.0)
            res.raise_for_status()
            content = res.json()["message"]["content"]
        except Exception as e:
            # Try to connect via OpenAI-compatible endpoint as secondary fallback
            try:
                openai_payload = {
                    "model": self.model_name,
                    "messages": formatted_messages,
                    "temperature": 0.0
                }
                res = requests.post(f"{self.base_url}/v1/chat/completions", json=openai_payload, timeout=300.0)
                res.raise_for_status()
                content = res.json()["choices"][0]["message"]["content"]
            except Exception as inner_e:
                raise RuntimeError(
                    f"Failed to query Ollama at {self.base_url}. "
                    f"Ensure Ollama is running and model '{self.model_name}' is pulled. "
                    f"Errors: {str(e)} | {str(inner_e)}"
                )

        class OllamaResponse:
            def __init__(self, content):
                self.content = content
        return OllamaResponse(content)

def get_llm(provider: str = "ollama", model_name: str = None) -> Any:
    """
    Loads and configures actual LLM chat interfaces (Ollama/OpenAI/Groq).
    No mock fallbacks - always returns the real requested client.
    """
    provider = provider.lower()
    
    if provider == "ollama":
        return OllamaChatClient(model_name=model_name)
        
    elif provider == "openai":
        from langchain_openapi import ChatOpenAI
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set.")
        return ChatOpenAI(model=model_name or "gpt-4o-mini", api_key=api_key)
            
    elif provider == "groq":
        from langchain_groq import ChatGroq
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is not set.")
        return ChatGroq(model_name=model_name or "llama3-8b-8192", groq_api_key=api_key)
            
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")
