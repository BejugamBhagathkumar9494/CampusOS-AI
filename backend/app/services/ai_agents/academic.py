"""Academic Agent service.

Deals with:
- Concept explanations
- Adaptive quiz generation
- Roadmaps for learning specific topics
- Elective suggestions
"""
from typing import List, Dict


def explain_concept(concept_name: str, grade_level: str = "undergraduate") -> str:
    """Uses LLM to explain a complex academic concept simply."""
    return f"Explanation for '{concept_name}' tailored for {grade_level} levels."


def generate_quiz(topic: str, num_questions: int = 5) -> List[Dict]:
    """Generates an adaptive practice quiz on a specific topic."""
    return [
        {
            "question_id": i,
            "question": f"Sample question {i} about {topic}",
            "options": ["A", "B", "C", "D"],
            "correct_option": "A",
        }
        for i in range(1, num_questions + 1)
    ]


def generate_learning_roadmap(target_skill: str) -> List[str]:
    """Generates a step-by-step roadmap to acquire a skill."""
    return [
        f"Step 1: Introduction to {target_skill} (Fundamentals)",
        "Step 2: Hands-on mini-projects",
        f"Step 3: Advanced concepts in {target_skill}",
        "Step 4: Capstone project & assessment",
    ]
