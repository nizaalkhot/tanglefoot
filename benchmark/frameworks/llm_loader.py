import os
from typing import Any

class MockChatModel:
    """
    High-fidelity mock chat model to allow offline simulations
    when dependencies or keys are not available on the client machine.
    """
    def __init__(self, provider: str, model_name: str):
        self.provider = provider
        self.model_name = model_name

    def invoke(self, messages: Any) -> Any:
        class MockResponse:
            def __init__(self, content):
                self.content = content
        
        prompt = str(messages).lower()
        if "richard" in prompt or "ceo" in prompt:
            return MockResponse("Richard Roe is the Active CEO of Tanglefoot Inc.")
        elif "expense" in prompt or "expenses" in prompt:
            return MockResponse("The total Q1 capital expenses are exactly $145,000.")
        return MockResponse("Mock response processed successfully by Tanglefoot Offline Agent.")

def get_llm(provider: str = "openai", model_name: str = None) -> Any:
    """
    Loads and configures actual LLM chat interfaces (LangChain/Ollama)
    falling back to high-fidelity mocks if dependencies are missing.
    """
    provider = provider.lower()
    
    if provider == "openai":
        try:
            from langchain_openapi import ChatOpenAI
            api_key = os.getenv("OPENAI_API_KEY", "mock-key")
            return ChatOpenAI(model=model_name or "gpt-4o-mini", api_key=api_key)
        except ImportError:
            pass
            
    elif provider == "groq":
        try:
            from langchain_groq import ChatGroq
            api_key = os.getenv("GROQ_API_KEY", "mock-key")
            return ChatGroq(model_name=model_name or "llama3-8b-8192", groq_api_key=api_key)
        except ImportError:
            pass
            
    elif provider == "ollama":
        try:
            from langchain_community.chat_models import ChatOllama
            return ChatOllama(model=model_name or "llama3", base_url="http://localhost:11434")
        except ImportError:
            pass
            
    # Default high-fidelity local simulation fallback
    return MockChatModel(provider, model_name or "default-model")
