"""
Independent check of the AI Lab's logistic regression using scikit-learn.

It trains on exactly the rows the TypeScript implementation uses (exported by
`node scripts/placement-experiment.ts --export-split split.json`) and prints the
held-out metrics so the two implementations can be compared.

Usage:
    node scripts/placement-experiment.ts --export-split split.json
    python scripts/verify_placement_experiment.py public/data/placement-training.json split.json
Requires numpy and scikit-learn.
"""
import json
import sys

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, balanced_accuracy_score, f1_score, roc_auc_score
from sklearn.preprocessing import StandardScaler

NUMERIC = ["cgpa", "internship_count", "project_count", "certification_count", "skill_count"]


def design(data, rows):
    x_num = np.column_stack([np.asarray(data[c], dtype=float)[rows] for c in NUMERIC])
    branch = np.asarray(data["branch_code"], dtype=int)[rows]
    x_branch = np.eye(6)[branch]
    y = (np.asarray(data["placed"], dtype=float)[rows] >= 0.5).astype(int)
    return x_num, x_branch, y


def main(dataset_path, split_path):
    ds = json.load(open(dataset_path, encoding="utf8"))
    split = json.load(open(split_path, encoding="utf8"))
    train, test = np.array(split["train"]), np.array(split["test"])
    xn_tr, xb_tr, y_tr = design(ds["data"], train)
    xn_te, xb_te, y_te = design(ds["data"], test)
    scaler = StandardScaler().fit(xn_tr)
    x_tr = np.hstack([scaler.transform(xn_tr), xb_tr])
    x_te = np.hstack([scaler.transform(xn_te), xb_te])
    model = LogisticRegression(C=1.0 / (0.001 * len(train)), max_iter=5000).fit(x_tr, y_tr)
    prob = model.predict_proba(x_te)[:, 1]
    pred = (prob >= 0.5).astype(int)
    majority = int(y_tr.mean() >= 0.5)
    print(json.dumps({
        "rows": {"train": int(len(train)), "test": int(len(test))},
        "baseline_accuracy": round(float(np.mean(y_te == majority)), 4),
        "accuracy": round(float(accuracy_score(y_te, pred)), 4),
        "balanced_accuracy": round(float(balanced_accuracy_score(y_te, pred)), 4),
        "f1": round(float(f1_score(y_te, pred)), 4),
        "roc_auc": round(float(roc_auc_score(y_te, prob)), 4),
    }, indent=2))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
