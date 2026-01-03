/**
 * TOPIC: RELATIONSHIP PATTERNS
 * DESCRIPTION:
 * Implementing one-to-many, many-to-many, and polymorphic relationships.
 */

// -------------------------------------------------------------------------------------------
// 1. ONE-TO-ONE
// -------------------------------------------------------------------------------------------

// Embedded (most common)
const userWithProfile = {
    _id: "user_001",
    name: "John",
    profile: {
        bio: "Developer",
        avatar: "url"
    }
};

// Referenced (when accessed separately or large)
const user = { _id: "user_001", name: "John", profileId: "profile_001" };
const profile = { _id: "profile_001", userId: "user_001", bio: "..." };

// -------------------------------------------------------------------------------------------
// 2. ONE-TO-MANY (Bounded)
// -------------------------------------------------------------------------------------------

// Embed in parent (array in one side)
const authorWithBooks = {
    _id: "author_001",
    name: "Jane Doe",
    books: [
        { title: "Book 1", year: 2020 },
        { title: "Book 2", year: 2021 }
    ]
};

// -------------------------------------------------------------------------------------------
// 3. ONE-TO-MANY (Unbounded)
// -------------------------------------------------------------------------------------------

// Reference in child
const post = { _id: "post_001", title: "Hello", authorId: "author_001" };
// Query: db.posts.find({ authorId: "author_001" })

// -------------------------------------------------------------------------------------------
// 4. MANY-TO-MANY
// -------------------------------------------------------------------------------------------

// Array of references in one side
const student = {
    _id: "student_001",
    name: "Alice",
    courseIds: ["course_001", "course_002"]
};

const course = {
    _id: "course_001",
    name: "MongoDB 101",
    studentIds: ["student_001", "student_002"]
};

// Or reference only from one side (choose based on access pattern)
const studentOneDirection = {
    _id: "student_001",
    name: "Alice",
    enrolledCourses: ["course_001", "course_002"]
};

// -------------------------------------------------------------------------------------------
// 5. POLYMORPHIC PATTERN
// -------------------------------------------------------------------------------------------

// Different types in same collection
const notifications = [
    {
        _id: "notif_001",
        type: "like",
        userId: "user_001",
        targetId: "post_001",
        createdAt: new Date()
    },
    {
        _id: "notif_002", 
        type: "comment",
        userId: "user_002",
        targetId: "post_001",
        commentText: "Great!",
        createdAt: new Date()
    },
    {
        _id: "notif_003",
        type: "follow",
        userId: "user_003",
        followedUserId: "user_001",
        createdAt: new Date()
    }
];

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * RELATIONSHIP PATTERNS:
 * 
 * One-to-One: Usually embed
 * One-to-Few: Embed array in parent
 * One-to-Many: Reference from child
 * Many-to-Many: Array of IDs in one or both sides
 * Polymorphic: Type field with varying structure
 */

module.exports = {
    userWithProfile,
    authorWithBooks,
    student,
    course,
    notifications
};
