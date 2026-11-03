# 静态题库练习模板

这是一套纯静态刷题页面：主页选择题库，通用答题页加载对应 JSON 做题。

## 文件结构

```text
index.html                     # 主页：选择题库
quiz.html                      # 通用答题页：加载题目、乱序、判分、保存进度
data/list.json                 # 题库列表，由脚本自动生成
data/questions/demo-final-1.json
data/questions/demo-final-2.json
scripts/generate-list.py       # 扫描 data/questions/ 并生成 data/list.json
```

## 本地预览

不要直接双击 HTML。进入本文件夹后运行：

```bash
python -m http.server 8000
```

浏览器打开：

```text
http://localhost:8000
```

## 新增一套题

1. 把题库转换成 JSON，放进：

```text
data/questions/
```

例如：

```text
data/questions/java-final.json
```

2. 在项目根目录运行：

```bash
python scripts/generate-list.py
```

3. 脚本会自动更新：

```text
data/list.json
```

4. 刷新主页，新题库就会出现。

## 题库 JSON 格式

```json
{
  "meta": {
    "id": "java-final",
    "title": "Java 期末复习",
    "generated": "2026-06-23",
    "desc": "Java 期末综合练习",
    "subject": "Java",
    "tags": ["期末", "选择题"],
    "shuffleOptions": true,
    "shuffleJudge": false,
    "shuffleQuestions": false,
    "durationMinutes": 0,
    "enabled": true
  },
  "single": [
    {
      "num": 1,
      "stem": "题干（ ）",
      "options": {
        "A": "选项A",
        "B": "选项B",
        "C": "选项C",
        "D": "选项D"
      },
      "answer": "B",
      "explanation": "可选解析"
    }
  ],
  "multi": [
    {
      "num": 1,
      "stem": "多选题题干（ ）",
      "options": {
        "A": "选项A",
        "B": "选项B",
        "C": "选项C",
        "D": "选项D"
      },
      "answer": "ABD"
    }
  ],
  "judge": [
    {
      "num": 1,
      "stem": "判断题题干。（ ）",
      "answer": "A"
    }
  ],
  "blank": [
    {
      "num": 1,
      "stem": "填空题：主页叫 {{blank}}，答题页叫 {{blank}}。",
      "answer": ["index.html", "quiz.html"]
    }
  ]
}
```

判断题默认：`A = 对`，`B = 错`。

## meta 字段说明

`meta.id`：题库唯一 ID。建议和文件名一致，例如 `java-final`。  
`meta.title`：主页显示的题库标题。  
`meta.desc`：题库描述。  
`meta.subject`：科目名称。  
`meta.tags`：标签。  
`meta.shuffleOptions`：是否打乱选项，默认 `true`。  
`meta.shuffleJudge`：是否打乱判断题“对/错”，默认 `false`。  
`meta.shuffleQuestions`：是否打乱题目顺序，默认 `false`。  
`meta.durationMinutes`：限时分钟数，`0` 表示不限时。  
`meta.enabled`：是否在主页显示，默认 `true`。

## 自动生成题库列表

脚本会扫描：

```text
data/questions/*.json
```

然后根据每个题库的 `meta` 和题目数量生成：

```text
data/list.json
```

所以你不需要手动编辑 `data/list.json`。

## 乱序和判分说明

- 乱序逻辑在 `quiz.html`。
- 判分保存的是原始选项 key，不依赖显示出来的新字母。
- 所以即使 A/B/C/D 显示顺序被打乱，答案仍然能正确判断。
- 每套题单独保存进度，key 类似：`quiz_answers_java-final`。

## 注意

这是静态刷题系统，答案在 JSON 里，适合复习自测。正式考试、防作弊、后台收分需要后端和数据库。
