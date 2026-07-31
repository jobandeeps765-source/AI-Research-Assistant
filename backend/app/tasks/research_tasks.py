from crewai import Task


def create_planning_task(agent, topic: str) -> Task:
    """Create the research planning task."""
    return Task(
        description=(
            f"Create a detailed research plan for the topic: '{topic}'.\n\n"
            "Your plan should include:\n"
            "1. A brief overview of the topic\n"
            "2. Key subtopics to investigate\n"
            "3. Specific questions to answer\n"
            "4. Areas of potential controversy or multiple viewpoints\n"
            "5. Current trends and future outlook\n\n"
            "Provide a structured outline that the research agent can follow."
        ),
        expected_output=(
            "A comprehensive research plan with numbered steps, "
            "key questions, and subtopics to investigate."
        ),
        agent=agent,
    )


def create_research_task(agent, topic: str) -> Task:
    """Create the information gathering task."""
    return Task(
        description=(
            f"Conduct thorough research on the topic: '{topic}'.\n\n"
            "Your research should include:\n"
            "1. Key facts and definitions\n"
            "2. Important statistics and data points\n"
            "3. Expert opinions and viewpoints\n"
            "4. Real-world examples and case studies\n"
            "5. Current trends and recent developments\n"
            "6. Challenges and limitations\n"
            "7. Future prospects\n\n"
            "Ensure all information is accurate and well-organized."
        ),
        expected_output=(
            "Comprehensive research findings organized by subtopic, "
            "including facts, statistics, examples, and expert insights."
        ),
        agent=agent,
    )


def create_writing_task(agent, topic: str) -> Task:
    """Create the report writing task."""
    return Task(
        description=(
            f"Write a professional research report on: '{topic}'.\n\n"
            "Use the research findings to create a report with:\n"
            "1. **Executive Summary** - Brief overview of key findings\n"
            "2. **Introduction** - Topic background and scope\n"
            "3. **Key Findings** - Detailed analysis with subheadings\n"
            "4. **Analysis & Discussion** - Critical evaluation\n"
            "5. **Conclusion** - Summary and final thoughts\n"
            "6. **Recommendations** - Practical suggestions\n\n"
            "Format in clean Markdown with proper headings, bullet points, "
            "and emphasis where appropriate. Make it professional and polished."
        ),
        expected_output=(
            "A complete, professionally formatted Markdown research report "
            "with executive summary, detailed sections, conclusion, "
            "and recommendations."
        ),
        agent=agent,
    )
