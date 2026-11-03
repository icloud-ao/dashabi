#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
扫描 data/questions/ 目录下的题库 JSON，自动生成 data/list.json。

用法：
  在项目根目录运行：python scripts/generate-list.py

题库文件建议在 meta 中写：
  id, title, desc, subject, tags,
  shuffleOptions, shuffleJudge, shuffleQuestions, durationMinutes, enabled
没有写的字段会自动用默认值。
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Dict, List

ROOT = Path(__file__).resolve().parents[1]
QUESTION_DIR = ROOT / "data" / "questions"
OUTPUT_FILE = ROOT / "data" / "list.json"

QUESTION_TYPES = ("single", "multi", "judge", "blank")


def load_json(path: Path) -> Dict[str, Any]:
    try:
        with path.open("r", encoding="utf-8-sig") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        raise SystemExit(f"JSON 格式错误：{path}\n{e}")
    if not isinstance(data, dict):
        raise SystemExit(f"题库文件必须是 JSON 对象：{path}")
    return data


def as_bool(value: Any, default: bool) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() not in {"0", "false", "no", "off", "否", "关闭"}
    return bool(value)


def as_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def count_questions(data: Dict[str, Any]) -> Dict[str, int]:
    counts: Dict[str, int] = {}
    total = 0

    if isinstance(data.get("questions"), list):
        total = len(data["questions"])
        counts.update({"single": 0, "multi": 0, "judge": 0, "blank": 0, "total": total})
        return counts

    for t in QUESTION_TYPES:
        n = len(data.get(t, []) or []) if isinstance(data.get(t, []), list) else 0
        counts[t] = n
        total += n
    counts["total"] = total
    return counts


def normalize_tags(value: Any) -> List[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(x) for x in value if str(x).strip()]
    if isinstance(value, str):
        parts = [x.strip() for x in value.replace("，", ",").split(",")]
        return [x for x in parts if x]
    return [str(value)]


def make_item(path: Path) -> Dict[str, Any]:
    data = load_json(path)
    meta = data.get("meta") if isinstance(data.get("meta"), dict) else {}
    counts = count_questions(data)

    qid = str(meta.get("id") or path.stem)
    title = str(meta.get("title") or qid)
    desc = str(meta.get("desc") or meta.get("description") or "")
    subject = str(meta.get("subject") or "")

    rel_file = "./" + path.relative_to(ROOT).as_posix()

    item: Dict[str, Any] = {
        "id": qid,
        "title": title,
        "desc": desc,
        "subject": subject,
        "tags": normalize_tags(meta.get("tags")),
        "file": rel_file,
        "shuffleOptions": as_bool(meta.get("shuffleOptions"), True),
        "shuffleJudge": as_bool(meta.get("shuffleJudge"), False),
        "shuffleQuestions": as_bool(meta.get("shuffleQuestions"), True),
        "durationMinutes": as_int(meta.get("durationMinutes"), 0),
        "enabled": as_bool(meta.get("enabled"), True),
        **counts,
    }
    return item


def main() -> None:
    if not QUESTION_DIR.exists():
        raise SystemExit(f"目录不存在：{QUESTION_DIR}")

    files = sorted(p for p in QUESTION_DIR.glob("*.json") if p.name != "list.json")
    if not files:
        raise SystemExit(f"没有找到题库 JSON：{QUESTION_DIR}")

    items = [make_item(p) for p in files]

    seen = set()
    duplicated = []
    for item in items:
        if item["id"] in seen:
            duplicated.append(item["id"])
        seen.add(item["id"])
    if duplicated:
        raise SystemExit("题库 id 重复：" + ", ".join(sorted(set(duplicated))))

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_FILE.open("w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"已生成：{OUTPUT_FILE.relative_to(ROOT)}")
    print(f"题库数量：{len(items)}")
    for item in items:
        print(f"- {item['id']}：{item['title']}（{item['total']} 题）")


if __name__ == "__main__":
    main()
