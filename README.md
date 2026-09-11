# Ahli Challenge V5 — Full Core Modes + 100 Questions

## الأنماط الشغالة

- Solo
- 1v1 Random Match
- 2v2 Random Match
- Private Room
- Join by code

## بنك الأسئلة

يوجد **100 سؤال** في:

`js/questions.js`

وكل مباراة تختار **10 أسئلة عشوائية** من البنك.

التصنيفات:
- تاريخ النادي
- الدوري والبطولات المحلية
- آسيا 2012
- نجوم الأهلي / عمر السومة
- آسيا للنخبة 2025
- آسيا للنخبة 2026

## 2v2

نتيجة 2v2 تعتمد على **مجموع نقاط الفريق**.
وتظهر أيضاً تفاصيل نقاط كل لاعب.

## الغرفة الخاصة

تبدأ عند وجود:
- لاعبين، أو
- 4 لاعبين

وجميع اللاعبين يجب أن يكونوا Ready.

## Firebase

استمر باستخدام:
- Anonymous Authentication
- Realtime Database

قواعد التطوير الحالية:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

هذه القواعد مناسبة للاختبار فقط.

## الاختبار

يفضل قبل تجربة نسخة جديدة حذف بيانات الاختبار القديمة:
- queues
- rooms
- roomCodes

ثم شغل `index.html` من Live Server.
