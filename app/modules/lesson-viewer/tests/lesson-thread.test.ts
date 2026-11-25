import { describe, it, expect } from "vitest";
import { UserRole } from "~/db/schema";
import { addComment, addLesson, addModule, addUser, setup } from "./fixtures";

function setupWithLesson() {
  const fixture = setup();
  const mod = addModule(fixture.db, {
    courseId: fixture.course.id,
    title: "M",
    position: 1,
  });
  const lesson = addLesson(fixture.db, {
    moduleId: mod.id,
    title: "L1",
    position: 1,
  });
  const other = addLesson(fixture.db, {
    moduleId: mod.id,
    title: "L2",
    position: 2,
  });
  return { ...fixture, lesson, other };
}

describe("getLessonThread", () => {
  it("is empty for an unknown lesson", () => {
    const { viewer } = setup();
    expect(viewer.getLessonThread(9999)).toEqual([]);
  });

  it("orders questions oldest first, nests replies, and marks who is staff", () => {
    const { db, viewer, user, instructor, lesson, other } = setupWithLesson();
    const admin = addUser(db, "Ada Admin", UserRole.Admin);
    const later = addComment(db, {
      lessonId: lesson.id,
      userId: user.id,
      body: "Later",
      createdAt: "2026-01-02T00:00:00.000Z",
      editedAt: "2026-01-03T00:00:00.000Z",
    });
    const earlier = addComment(db, {
      lessonId: lesson.id,
      userId: admin.id,
      body: "Earlier",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    const reply = addComment(db, {
      lessonId: lesson.id,
      userId: instructor.id,
      body: "Reply",
      parentId: later.id,
      createdAt: "2026-01-04T00:00:00.000Z",
    });
    addComment(db, { lessonId: other.id, userId: user.id, body: "Elsewhere" });

    const thread = viewer.getLessonThread(lesson.id);

    expect(thread).toEqual([
      {
        id: earlier.id,
        body: "Earlier",
        createdAt: "2026-01-01T00:00:00.000Z",
        editedAt: null,
        deleted: false,
        author: {
          id: admin.id,
          name: "Ada Admin",
          avatarUrl: null,
          isInstructor: false,
          isPlatformAdmin: true,
        },
        replies: [],
      },
      {
        id: later.id,
        body: "Later",
        createdAt: "2026-01-02T00:00:00.000Z",
        editedAt: "2026-01-03T00:00:00.000Z",
        deleted: false,
        author: {
          id: user.id,
          name: user.name,
          avatarUrl: null,
          isInstructor: false,
          isPlatformAdmin: false,
        },
        replies: [
          {
            id: reply.id,
            body: "Reply",
            createdAt: "2026-01-04T00:00:00.000Z",
            editedAt: null,
            deleted: false,
            author: {
              id: instructor.id,
              name: instructor.name,
              avatarUrl: null,
              isInstructor: true,
              isPlatformAdmin: false,
            },
            replies: [],
          },
        ],
      },
    ]);
  });

  it("breaks a tie on time by id", () => {
    const { db, viewer, user, lesson } = setupWithLesson();
    const at = "2026-01-01T00:00:00.000Z";
    const first = addComment(db, {
      lessonId: lesson.id,
      userId: user.id,
      body: "1",
      createdAt: at,
    });
    const second = addComment(db, {
      lessonId: lesson.id,
      userId: user.id,
      body: "2",
      createdAt: at,
    });
    expect(viewer.getLessonThread(lesson.id).map((c) => c.id)).toEqual([
      first.id,
      second.id,
    ]);
  });

  it("blanks a deleted question that still has replies, and drops deleted replies", () => {
    const { db, viewer, user, lesson } = setupWithLesson();
    const question = addComment(db, {
      lessonId: lesson.id,
      userId: user.id,
      body: "Secret",
      editedAt: "2026-01-02T00:00:00.000Z",
      deletedAt: "2026-01-03T00:00:00.000Z",
    });
    const kept = addComment(db, {
      lessonId: lesson.id,
      userId: user.id,
      body: "Kept",
      parentId: question.id,
    });
    addComment(db, {
      lessonId: lesson.id,
      userId: user.id,
      body: "Gone",
      parentId: question.id,
      deletedAt: "2026-01-03T00:00:00.000Z",
    });

    const [only, ...rest] = viewer.getLessonThread(lesson.id);

    expect(rest).toEqual([]);
    expect(only).toMatchObject({
      id: question.id,
      body: "",
      editedAt: null,
      deleted: true,
    });
    expect(only.replies.map((r) => r.id)).toEqual([kept.id]);
  });

  it("drops a deleted question with no replies left", () => {
    const { db, viewer, user, lesson } = setupWithLesson();
    const question = addComment(db, {
      lessonId: lesson.id,
      userId: user.id,
      body: "Gone",
      deletedAt: "2026-01-03T00:00:00.000Z",
    });
    addComment(db, {
      lessonId: lesson.id,
      userId: user.id,
      body: "Also gone",
      parentId: question.id,
      deletedAt: "2026-01-03T00:00:00.000Z",
    });
    expect(viewer.getLessonThread(lesson.id)).toEqual([]);
  });

  it("leaves out a reply to a reply", () => {
    const { db, viewer, user, lesson } = setupWithLesson();
    const question = addComment(db, {
      lessonId: lesson.id,
      userId: user.id,
      body: "Question",
    });
    const reply = addComment(db, {
      lessonId: lesson.id,
      userId: user.id,
      body: "Reply",
      parentId: question.id,
    });
    addComment(db, {
      lessonId: lesson.id,
      userId: user.id,
      body: "Nested",
      parentId: reply.id,
    });

    const [only] = viewer.getLessonThread(lesson.id);
    expect(only.replies.map((r) => r.id)).toEqual([reply.id]);
    expect(only.replies[0].replies).toEqual([]);
  });
});

describe("getCommentById", () => {
  it("finds a comment by id, and nothing for an unknown id", () => {
    const { db, viewer, user, lesson } = setupWithLesson();
    const comment = addComment(db, {
      lessonId: lesson.id,
      userId: user.id,
      body: "Hi",
    });
    expect(viewer.getCommentById(comment.id)?.lessonId).toBe(lesson.id);
    expect(viewer.getCommentById(9999)).toBeUndefined();
  });
});

describe("renderThread", () => {
  it("renders every body to sanitised HTML, keeping the nesting", async () => {
    const { db, viewer, user, lesson } = setupWithLesson();
    const question = addComment(db, {
      lessonId: lesson.id,
      userId: user.id,
      body: "**Deleted**",
      deletedAt: "2026-01-03T00:00:00.000Z",
    });
    addComment(db, {
      lessonId: lesson.id,
      userId: user.id,
      body: "**bold** <script>alert(1)</script>",
      parentId: question.id,
    });

    const [rendered] = await viewer.renderThread(
      viewer.getLessonThread(lesson.id)
    );

    expect(rendered.bodyHtml).toBe("");
    expect(rendered.replies[0].bodyHtml).toContain("<strong>bold</strong>");
    expect(rendered.replies[0].bodyHtml).not.toContain("<script>");
    expect(rendered.replies[0].replies).toEqual([]);
  });
});
