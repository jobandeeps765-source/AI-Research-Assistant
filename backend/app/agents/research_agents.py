import os
from crewai import Agent
from app.config import get_settings

settings = get_settings()

os.environ["GOOGLE_API_KEY"] = settings.GEMINI_API_KEY


def create_planner_agent() -> Agent:
    """Create the Research Planner agent."""
    return Agent(
        role="Research Planner",
        goal=(
            "Analyze the user's research topic and create a comprehensive, "
            "step-by-step research plan that covers all important aspects."
        ),
        backstory=(
            "You are an expert research strategist with years of experience "
            "in breaking down complex topics into manageable research tasks. "
            "You excel at identifying key areas of investigation and creating "
            "logical workflows for thorough research."
        ),
        llm="gemini-1.5-flash",
        verbose=True,
        allow_delegation=False,
    )


def create_researcher_agent() -> Agent:
    """Create the AI Research Specialist agent."""
    return Agent(
        role="AI Research Specialist",
        goal=(
            "Gather comprehensive, accurate, and relevant information about "
            "the research topic. Collect facts, statistics, expert opinions, "
            "and real-world examples."
        ),
        backstory=(
            "You are a seasoned research specialist with deep expertise in "
            "information gathering and analysis. You have access to vast "
            "knowledge and can synthesize information from multiple domains "
            "to provide well-rounded research findings."
        ),
        llm="gemini-1.5-flash",
        verbose=True,
        allow_delegation=False,
    )


def create_writer_agent() -> Agent:
    """Create the Technical Report Writer agent."""
    return Agent(
        role="Technical Report Writer",
        goal=(
            "Transform the research findings into a professional, well-structured "
            "report with clear sections, executive summary, detailed analysis, "
            "and conclusion. Format everything beautifully in Markdown."
        ),
        backstory=(
            "You are a talented technical writer who excels at creating "
            "professional research reports. Your writing is clear, concise, "
            "and well-organized. You have a talent for making complex information "
            "accessible and engaging."
        ),
        llm="gemini-1.5-flash",
        verbose=True,
        allow_delegation=False,
    )
