"""Academic and Curriculum Dataset Preprocessing Module.

Processes OULAD dataset files (studentInfo, courses, assessments, studentAssessment, studentRegistration)
into structured, clean feature matrices for machine learning training and inference.
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Tuple, Any


DATASET_DIR = Path(__file__).resolve().parents[3] / "campusos Datasets"

NUMERICAL_FEATURES = [
    "num_of_prev_attempts",
    "studied_credits",
    "module_presentation_length",
    "date_registration",
    "assessment_count",
    "mean_assessment_score",
    "min_assessment_score",
    "max_assessment_score",
    "total_weighted_score",
    "late_submissions",
    "avg_days_late",
]

CATEGORICAL_FEATURES = [
    "code_module",
    "gender",
    "region",
    "highest_education",
    "imd_band",
    "age_band",
    "disability",
]


class AcademicDataPreprocessor:
    """Preprocesses academic & curriculum datasets for model training and evaluation."""

    def __init__(self, data_dir: Path | str = DATASET_DIR):
        self.data_dir = Path(data_dir)

    def load_raw_datasets(self) -> Dict[str, Any]:
        """Loads raw CSV files from dataset directory."""
        import pandas as pd
        files = {
            "student_info": "studentInfo.csv",
            "courses": "courses.csv",
            "assessments": "assessments.csv",
            "student_assessment": "studentAssessment.csv",
            "student_registration": "studentRegistration.csv",
            "vle": "vle.csv",
        }
        dfs = {}
        for key, fname in files.items():
            fpath = self.data_dir / fname
            if fpath.is_file():
                dfs[key] = pd.read_csv(fpath)
            else:
                dfs[key] = pd.DataFrame()
        return dfs

    def preprocess_and_merge(self) -> Any:
        """Merges datasets and engineers academic performance features."""
        import numpy as np
        import pandas as pd
        dfs = self.load_raw_datasets()
        if dfs["student_info"].empty:
            raise FileNotFoundError(f"studentInfo.csv not found in {self.data_dir}")

        student_info = dfs["student_info"].copy()
        courses = dfs["courses"].copy()
        assessments = dfs["assessments"].copy()
        student_assessment = dfs["student_assessment"].copy()
        student_registration = dfs["student_registration"].copy()

        # 1. Process Assessment Features
        if not student_assessment.empty and not assessments.empty:
            sa_merged = pd.merge(student_assessment, assessments, on="id_assessment", how="left")
            sa_merged["days_late"] = sa_merged["date_submitted"] - sa_merged["date"]
            sa_merged["days_late"] = sa_merged["days_late"].apply(
                lambda x: max(0, float(x)) if pd.notnull(x) else 0.0
            )
            sa_merged["weighted_contrib"] = (
                sa_merged["score"].fillna(0) * sa_merged["weight"].fillna(0) / 100.0
            )

            sa_agg = sa_merged.groupby(["code_module", "code_presentation", "id_student"]).agg(
                assessment_count=("id_assessment", "count"),
                mean_assessment_score=("score", "mean"),
                min_assessment_score=("score", "min"),
                max_assessment_score=("score", "max"),
                total_weighted_score=("weighted_contrib", "sum"),
                late_submissions=("days_late", lambda x: int((x > 0).sum())),
                avg_days_late=("days_late", "mean"),
            ).reset_index()
        else:
            sa_agg = pd.DataFrame(columns=["code_module", "code_presentation", "id_student"] + NUMERICAL_FEATURES[4:])

        # 2. Merge Courses Length
        merged = pd.merge(student_info, courses, on=["code_module", "code_presentation"], how="left")

        # 3. Merge Registration Information
        if not student_registration.empty:
            merged = pd.merge(merged, student_registration, on=["code_module", "code_presentation", "id_student"], how="left")
        else:
            merged["date_registration"] = -30.0

        # 4. Merge Assessment Aggregates
        merged = pd.merge(merged, sa_agg, on=["code_module", "code_presentation", "id_student"], how="left")

        # Fill Missing Values with baseline defaults
        merged["assessment_count"] = merged["assessment_count"].fillna(0)
        merged["mean_assessment_score"] = merged["mean_assessment_score"].fillna(0.0)
        merged["min_assessment_score"] = merged["min_assessment_score"].fillna(0.0)
        merged["max_assessment_score"] = merged["max_assessment_score"].fillna(0.0)
        merged["total_weighted_score"] = merged["total_weighted_score"].fillna(0.0)
        merged["late_submissions"] = merged["late_submissions"].fillna(0)
        merged["avg_days_late"] = merged["avg_days_late"].fillna(0.0)
        merged["date_registration"] = merged["date_registration"].fillna(-30.0)
        merged["module_presentation_length"] = merged["module_presentation_length"].fillna(260.0)
        merged["imd_band"] = merged["imd_band"].fillna("Missing")

        # Define Targets:
        # Binary target: is_at_risk = 1 (Fail, Withdrawn), 0 (Pass, Distinction)
        merged["is_at_risk"] = merged["final_result"].isin(["Fail", "Withdrawn"]).astype(int)
        
        # 3-class target: 0 = Low Risk (Distinction), 1 = Medium Risk (Pass), 2 = High Risk (Fail/Withdrawn)
        risk_map = {"Distinction": 0, "Pass": 1, "Fail": 2, "Withdrawn": 2}
        merged["risk_level_code"] = merged["final_result"].map(risk_map).fillna(1).astype(int)

        return merged

    def get_feature_matrix(self) -> Tuple[Any, Any, Any]:
        """Returns feature matrix X, binary target y_risk, and multi-class target y_multiclass."""
        df = self.preprocess_and_merge()
        X = df[NUMERICAL_FEATURES + CATEGORICAL_FEATURES].copy()
        y_risk = df["is_at_risk"].copy()
        y_multiclass = df["risk_level_code"].copy()
        return X, y_risk, y_multiclass


@lru_cache(maxsize=1)
def get_preprocessed_academic_data() -> Any:
    """Cached accessor for preprocessed academic dataframe."""
    processor = AcademicDataPreprocessor()
    return processor.preprocess_and_merge()
