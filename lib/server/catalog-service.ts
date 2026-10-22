import { and, eq } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "../../db";
import { questions } from "../../db/schema";
import { questionEligible,questionInGsScope } from '../question-review';
import bank from '../combined-question-bank';

export async function getPublishedQuestion(exam: string, year: number, slug: string) {
  if (!questionEligible(slug)||!questionInGsScope(slug)) return null;
  if (!isDatabaseConfigured()) return null;
  const db = getDb();
  const row=(await db.select().from(questions).where(and(
    eq(questions.id, slug),
    eq(questions.workflowStatus, "published"),
    eq(questions.verificationStatus, "verified"),
  )))[0];
  if(!row) return null;
  const q=bank.questions.find(q=>q.id===row.id);
  const corrected=q?{...row,exam:q.exam,year:q.year,paper:q.paper,sourceQuestionNumber:String(q.questionNumber),subject:q.subject,topic:q.topic,subtopic:q.subtopic,stem:q.sourceText,promptLines:q.promptLines,options:q.options,correctOption:q.answer,explanation:q.explanation,source:q.source}:row;
  return corrected.exam===exam&&corrected.year===year?corrected:null;
}
