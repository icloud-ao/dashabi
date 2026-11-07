# 静态题库练习模板

## 文件结构

```text
index.html              # 主页：选择题库
quiz.html               # 通用答题页：加载题目、乱序、判分、保存进度
data/list.json          # 题库列表
data/demo-final-1.json  # 示例题库 1
data/demo-final-2.json  # 示例题库 2
```

## 答题页版本

主页的「整套刷题」通过 `/q/题库ID` 打开主答题页 `quiz.html`（V5），也可以使用 `/quiz.html?set=题库ID`。
在右上角设置中选择「返回旧版」，会打开同一题库的 `/quiz_old.html?set=题库ID`。
各版本都可以用对应文件名加 `?set=题库ID` 直接打开。

| 版本 | 文件 | 说明 |
| --- | --- | --- |
| V5 | `quiz.html`、`quiz_v5.html` | 当前主答题页，保留 V5 独立入口 |
| V2 | `quiz_v2.html` | claude微改版，界面依旧老旧但加入动画 |
| V3 | `quiz_v3.html` | 半透明菜单+动画，第一版gemini生成的ios风格 |
| V4 | `quiz_v4.html` | 手机+ipad使用淡化菜单，电脑端使用v3版半透明菜单，动画完美 |
| old | `quiz_old.html` | 第一版，旧版答题页 |

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

1. 把题库转换为 JSON，放到 `data/` 目录，例如：

```text
data/java-final.json
```

2. 在 `data/list.json` 里加一条：

```json
{
  "id": "java-final",
  "title": "Java 期末复习",
  "desc": "Java 期末综合练习",
  "subject": "Java",
  "tags": ["期末", "选择题"],
  "file": "./data/java-final.json",
  "shuffleOptions": true,
  "shuffleJudge": false,
  "shuffleQuestions": false,
  "durationMinutes": 0,
  "enabled": true
}
```

3. 打开主页，就会自动出现这套题。

## 题库 JSON 格式

```json
{
  "meta": {
    "title": "Java 期末复习",
    "generated": "2026-06-23"
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

## 乱序说明

- 选项乱序逻辑在 `quiz.html`。
- 判分不依赖显示出来的新字母，而是保存原始选项 key。
- 所以即使 A/B/C/D 显示顺序乱了，答案仍然能正确判断。
- 每套题单独保存进度，key 类似：`quiz_answers_java-final`。

## 配置说明

`data/list.json` 中每套题可配置：

- `shuffleOptions`: 是否打乱选项，默认建议 `true`
- `shuffleJudge`: 是否打乱判断题“对/错”，默认建议 `false`
- `shuffleQuestions`: 是否打乱题目顺序
- `enabled`: 是否在主页显示
