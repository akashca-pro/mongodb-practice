/**
 * MONGODB PRACTICE PROBLEMS - AGGREGATION PIPELINE
 * 
 * This file contains practice problems for the MongoDB Aggregation Framework.
 * Problems range from basic to advanced, covering all major pipeline stages.
 * 
 * RUN IN MONGOSH: Copy and paste commands into mongosh to practice.
 */

// ==========================================================================================
// SETUP: Create sample database and collections
// ==========================================================================================

// use practiceDB

// Drop existing collections for clean start
db.employees.drop()
db.sales.drop()
db.movies.drop()

// Insert sample employees
db.employees.insertMany([
    { _id: 1, name: "John Smith", department: "Engineering", position: "Senior Developer", salary: 95000, hireDate: new Date("2019-03-15"), skills: ["JavaScript", "Python", "MongoDB"], manager: null },
    { _id: 2, name: "Jane Doe", department: "Engineering", position: "Junior Developer", salary: 65000, hireDate: new Date("2022-06-01"), skills: ["JavaScript", "React"], manager: 1 },
    { _id: 3, name: "Bob Wilson", department: "Engineering", position: "Tech Lead", salary: 120000, hireDate: new Date("2017-01-20"), skills: ["Java", "Kubernetes", "AWS"], manager: null },
    { _id: 4, name: "Alice Brown", department: "Marketing", position: "Marketing Manager", salary: 85000, hireDate: new Date("2020-09-10"), skills: ["SEO", "Analytics", "Content"], manager: null },
    { _id: 5, name: "Charlie Davis", department: "Marketing", position: "Content Writer", salary: 55000, hireDate: new Date("2023-02-14"), skills: ["Writing", "SEO"], manager: 4 },
    { _id: 6, name: "Diana Lee", department: "HR", position: "HR Director", salary: 95000, hireDate: new Date("2018-07-22"), skills: ["Recruiting", "Training"], manager: null },
    { _id: 7, name: "Edward Kim", department: "Engineering", position: "DevOps Engineer", salary: 100000, hireDate: new Date("2021-04-05"), skills: ["Docker", "Kubernetes", "AWS", "Terraform"], manager: 3 },
    { _id: 8, name: "Fiona Green", department: "Sales", position: "Sales Director", salary: 110000, hireDate: new Date("2016-11-30"), skills: ["Negotiation", "CRM"], manager: null },
    { _id: 9, name: "George White", department: "Sales", position: "Account Executive", salary: 70000, hireDate: new Date("2022-08-18"), skills: ["CRM", "Presentations"], manager: 8 },
    { _id: 10, name: "Helen Black", department: "Engineering", position: "QA Engineer", salary: 75000, hireDate: new Date("2021-10-25"), skills: ["Testing", "Selenium", "Python"], manager: 3 }
])

// Insert sample sales data
db.sales.insertMany([
    { _id: 1, product: "Laptop", category: "Electronics", quantity: 5, price: 1200, region: "North", date: new Date("2024-01-05"), salesperson: "George White" },
    { _id: 2, product: "Phone", category: "Electronics", quantity: 15, price: 800, region: "South", date: new Date("2024-01-08"), salesperson: "George White" },
    { _id: 3, product: "Tablet", category: "Electronics", quantity: 8, price: 500, region: "East", date: new Date("2024-01-12"), salesperson: "Fiona Green" },
    { _id: 4, product: "Desk", category: "Furniture", quantity: 3, price: 350, region: "North", date: new Date("2024-01-15"), salesperson: "George White" },
    { _id: 5, product: "Chair", category: "Furniture", quantity: 20, price: 150, region: "West", date: new Date("2024-01-18"), salesperson: "Fiona Green" },
    { _id: 6, product: "Monitor", category: "Electronics", quantity: 10, price: 400, region: "North", date: new Date("2024-01-22"), salesperson: "George White" },
    { _id: 7, product: "Keyboard", category: "Electronics", quantity: 25, price: 100, region: "South", date: new Date("2024-01-25"), salesperson: "Fiona Green" },
    { _id: 8, product: "Lamp", category: "Furniture", quantity: 12, price: 75, region: "East", date: new Date("2024-01-28"), salesperson: "George White" },
    { _id: 9, product: "Laptop", category: "Electronics", quantity: 3, price: 1200, region: "West", date: new Date("2024-02-02"), salesperson: "George White" },
    { _id: 10, product: "Phone", category: "Electronics", quantity: 20, price: 800, region: "North", date: new Date("2024-02-05"), salesperson: "Fiona Green" },
    { _id: 11, product: "Headphones", category: "Electronics", quantity: 30, price: 200, region: "South", date: new Date("2024-02-08"), salesperson: "George White" },
    { _id: 12, product: "Desk", category: "Furniture", quantity: 5, price: 350, region: "East", date: new Date("2024-02-12"), salesperson: "Fiona Green" }
])

// Insert sample movies
db.movies.insertMany([
    { _id: 1, title: "The Matrix", year: 1999, genres: ["Sci-Fi", "Action"], rating: 8.7, director: "Wachowskis", cast: ["Keanu Reeves", "Laurence Fishburne"], boxOffice: { budget: 63000000, gross: 465000000 } },
    { _id: 2, title: "Inception", year: 2010, genres: ["Sci-Fi", "Thriller"], rating: 8.8, director: "Christopher Nolan", cast: ["Leonardo DiCaprio", "Tom Hardy"], boxOffice: { budget: 160000000, gross: 836000000 } },
    { _id: 3, title: "The Dark Knight", year: 2008, genres: ["Action", "Drama"], rating: 9.0, director: "Christopher Nolan", cast: ["Christian Bale", "Heath Ledger"], boxOffice: { budget: 185000000, gross: 1004000000 } },
    { _id: 4, title: "Pulp Fiction", year: 1994, genres: ["Crime", "Drama"], rating: 8.9, director: "Quentin Tarantino", cast: ["John Travolta", "Samuel L. Jackson"], boxOffice: { budget: 8000000, gross: 213000000 } },
    { _id: 5, title: "Forrest Gump", year: 1994, genres: ["Drama", "Romance"], rating: 8.8, director: "Robert Zemeckis", cast: ["Tom Hanks"], boxOffice: { budget: 55000000, gross: 678000000 } },
    { _id: 6, title: "The Shawshank Redemption", year: 1994, genres: ["Drama"], rating: 9.3, director: "Frank Darabont", cast: ["Tim Robbins", "Morgan Freeman"], boxOffice: { budget: 25000000, gross: 58000000 } },
    { _id: 7, title: "Interstellar", year: 2014, genres: ["Sci-Fi", "Drama"], rating: 8.6, director: "Christopher Nolan", cast: ["Matthew McConaughey", "Anne Hathaway"], boxOffice: { budget: 165000000, gross: 677000000 } },
    { _id: 8, title: "Fight Club", year: 1999, genres: ["Drama", "Thriller"], rating: 8.8, director: "David Fincher", cast: ["Brad Pitt", "Edward Norton"], boxOffice: { budget: 63000000, gross: 100000000 } }
])

print("✅ Sample data for aggregation problems inserted!")


// ==========================================================================================
// PROBLEM 1: Basic $match and $project
// ==========================================================================================

/**
 * PROBLEM 1.1: Simple $match
 * 
 * Find all employees in the Engineering department
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.employees.aggregate([
    { $match: { department: "Engineering" } }
])

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 1.2: $match with comparison
 * 
 * Find all employees with salary greater than 80000
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.employees.aggregate([
    { $match: { salary: { $gt: 80000 } } }
])

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 1.3: Simple $project
 * 
 * Return only name and salary for all employees (exclude _id)
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.employees.aggregate([
    { $project: { _id: 0, name: 1, salary: 1 } }
])

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 1.4: $project with computed field
 * 
 * Return employee name and their annual bonus (10% of salary)
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.employees.aggregate([
    { 
        $project: { 
            _id: 0,
            name: 1, 
            annualBonus: { $multiply: ["$salary", 0.10] } 
        } 
    }
])

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 1.5: Combined $match and $project
 * 
 * Find all Engineering employees and show their name, position, and monthly salary
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.employees.aggregate([
    { $match: { department: "Engineering" } },
    { 
        $project: { 
            _id: 0,
            name: 1, 
            position: 1, 
            monthlySalary: { $divide: ["$salary", 12] } 
        } 
    }
])


// ==========================================================================================
// PROBLEM 2: $group and Accumulators
// ==========================================================================================

/**
 * PROBLEM 2.1: Group and count
 * 
 * Count the number of employees in each department
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.employees.aggregate([
    { 
        $group: { 
            _id: "$department", 
            employeeCount: { $sum: 1 } 
        } 
    }
])

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 2.2: Group with $sum
 * 
 * Calculate the total salary expense per department
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.employees.aggregate([
    { 
        $group: { 
            _id: "$department", 
            totalSalary: { $sum: "$salary" } 
        } 
    }
])

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 2.3: Group with $avg
 * 
 * Calculate the average salary per department
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.employees.aggregate([
    { 
        $group: { 
            _id: "$department", 
            avgSalary: { $avg: "$salary" } 
        } 
    }
])

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 2.4: Group with $min and $max
 * 
 * Find the minimum and maximum salary in each department
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.employees.aggregate([
    { 
        $group: { 
            _id: "$department", 
            minSalary: { $min: "$salary" },
            maxSalary: { $max: "$salary" }
        } 
    }
])

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 2.5: Group with $push
 * 
 * Group employees by department and list all employee names in each department
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.employees.aggregate([
    { 
        $group: { 
            _id: "$department", 
            employees: { $push: "$name" } 
        } 
    }
])

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 2.6: Group with multiple accumulators
 * 
 * For each department, calculate: total employees, total salary, average salary
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.employees.aggregate([
    { 
        $group: { 
            _id: "$department", 
            count: { $sum: 1 },
            totalSalary: { $sum: "$salary" },
            avgSalary: { $avg: "$salary" }
        } 
    }
])


// ==========================================================================================
// PROBLEM 3: $sort, $limit, $skip
// ==========================================================================================

/**
 * PROBLEM 3.1: Sort results
 * 
 * Get all employees sorted by salary (highest first)
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.employees.aggregate([
    { $sort: { salary: -1 } }
])

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 3.2: Limit results
 * 
 * Get the top 3 highest-paid employees
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.employees.aggregate([
    { $sort: { salary: -1 } },
    { $limit: 3 }
])

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 3.3: Skip and Limit (Pagination)
 * 
 * Get employees 4-6 when sorted by hire date (oldest first)
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.employees.aggregate([
    { $sort: { hireDate: 1 } },
    { $skip: 3 },
    { $limit: 3 }
])

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 3.4: Group, sort, and limit
 * 
 * Find the department with the highest total salary
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.employees.aggregate([
    { $group: { _id: "$department", totalSalary: { $sum: "$salary" } } },
    { $sort: { totalSalary: -1 } },
    { $limit: 1 }
])


// ==========================================================================================
// PROBLEM 4: $unwind
// ==========================================================================================

/**
 * PROBLEM 4.1: Basic $unwind
 * 
 * Unwind the skills array to get one document per skill per employee
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.employees.aggregate([
    { $unwind: "$skills" }
])

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 4.2: Unwind and count
 * 
 * Count how many employees have each skill
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.employees.aggregate([
    { $unwind: "$skills" },
    { $group: { _id: "$skills", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
])

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 4.3: Unwind with preserveNullAndEmptyArrays
 * 
 * Unwind genres in movies, keeping movies that might not have genres
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.movies.aggregate([
    { $unwind: { path: "$genres", preserveNullAndEmptyArrays: true } }
])

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 4.4: Count movies per genre
 * 
 * Count how many movies are in each genre
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.movies.aggregate([
    { $unwind: "$genres" },
    { $group: { _id: "$genres", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
])


// ==========================================================================================
// PROBLEM 5: $lookup (Joins)
// ==========================================================================================

/**
 * PROBLEM 5.1: Basic $lookup
 * 
 * Join employees with their managers (self-join)
 * Show employee name, position, and manager name
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.employees.aggregate([
    { 
        $lookup: {
            from: "employees",
            localField: "manager",
            foreignField: "_id",
            as: "managerInfo"
        }
    },
    { $unwind: { path: "$managerInfo", preserveNullAndEmptyArrays: true } },
    { 
        $project: {
            _id: 0,
            name: 1,
            position: 1,
            managerName: { $ifNull: ["$managerInfo.name", "No Manager"] }
        }
    }
])

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 5.2: $lookup with pipeline
 * 
 * For each department, find employees earning above the department average
 * (This requires a more advanced lookup)
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
// First, let's create a simpler version: find employees and their department's average salary
db.employees.aggregate([
    {
        $lookup: {
            from: "employees",
            let: { dept: "$department" },
            pipeline: [
                { $match: { $expr: { $eq: ["$department", "$$dept"] } } },
                { $group: { _id: null, avgSalary: { $avg: "$salary" } } }
            ],
            as: "deptStats"
        }
    },
    { $unwind: "$deptStats" },
    { 
        $project: {
            name: 1,
            department: 1,
            salary: 1,
            departmentAvg: "$deptStats.avgSalary",
            aboveAverage: { $gt: ["$salary", "$deptStats.avgSalary"] }
        }
    }
])


// ==========================================================================================
// PROBLEM 6: $addFields and $set
// ==========================================================================================

/**
 * PROBLEM 6.1: Add computed field
 * 
 * Add a field "yearsEmployed" based on hireDate
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.employees.aggregate([
    {
        $addFields: {
            yearsEmployed: {
                $floor: {
                    $divide: [
                        { $subtract: [new Date(), "$hireDate"] },
                        1000 * 60 * 60 * 24 * 365
                    ]
                }
            }
        }
    }
])

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 6.2: Add multiple fields
 * 
 * Add both "skillCount" (number of skills) and "taxRate" (30% for salary > 90000, else 20%)
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.employees.aggregate([
    {
        $addFields: {
            skillCount: { $size: "$skills" },
            taxRate: { $cond: [{ $gt: ["$salary", 90000] }, 0.30, 0.20] }
        }
    }
])


// ==========================================================================================
// PROBLEM 7: $bucket and $bucketAuto
// ==========================================================================================

/**
 * PROBLEM 7.1: Salary buckets
 * 
 * Group employees into salary buckets: 0-60000, 60000-80000, 80000-100000, 100000+
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.employees.aggregate([
    {
        $bucket: {
            groupBy: "$salary",
            boundaries: [0, 60000, 80000, 100000, Infinity],
            default: "Other",
            output: {
                count: { $sum: 1 },
                employees: { $push: "$name" }
            }
        }
    }
])

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 7.2: Auto buckets
 * 
 * Automatically create 3 buckets for movie ratings
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.movies.aggregate([
    {
        $bucketAuto: {
            groupBy: "$rating",
            buckets: 3,
            output: {
                count: { $sum: 1 },
                movies: { $push: "$title" }
            }
        }
    }
])


// ==========================================================================================
// PROBLEM 8: $facet (Multiple Pipelines)
// ==========================================================================================

/**
 * PROBLEM 8.1: Multi-faceted analysis
 * 
 * Create a faceted result for employees with:
 * - "byDepartment": count per department
 * - "topPaid": top 3 highest paid
 * - "bySeniority": buckets by years employed
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.employees.aggregate([
    {
        $facet: {
            byDepartment: [
                { $group: { _id: "$department", count: { $sum: 1 } } }
            ],
            topPaid: [
                { $sort: { salary: -1 } },
                { $limit: 3 },
                { $project: { name: 1, salary: 1 } }
            ],
            salaryDistribution: [
                {
                    $bucket: {
                        groupBy: "$salary",
                        boundaries: [0, 70000, 90000, 110000, Infinity],
                        output: { count: { $sum: 1 } }
                    }
                }
            ]
        }
    }
])


// ==========================================================================================
// PROBLEM 9: Date Operations
// ==========================================================================================

/**
 * PROBLEM 9.1: Extract date parts
 * 
 * Show sales with year, month, and day of week extracted
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.sales.aggregate([
    {
        $project: {
            product: 1,
            date: 1,
            year: { $year: "$date" },
            month: { $month: "$date" },
            dayOfWeek: { $dayOfWeek: "$date" }
        }
    }
])

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 9.2: Group by month
 * 
 * Calculate total sales revenue per month
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.sales.aggregate([
    {
        $group: {
            _id: { $month: "$date" },
            totalRevenue: { $sum: { $multiply: ["$quantity", "$price"] } },
            salesCount: { $sum: 1 }
        }
    },
    { $sort: { _id: 1 } }
])

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 9.3: Filter by date range
 * 
 * Find all sales from January 2024
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.sales.aggregate([
    {
        $match: {
            date: {
                $gte: new Date("2024-01-01"),
                $lt: new Date("2024-02-01")
            }
        }
    }
])


// ==========================================================================================
// PROBLEM 10: String Operations
// ==========================================================================================

/**
 * PROBLEM 10.1: String concatenation
 * 
 * Create a "fullTitle" field combining position and department
 * Format: "Position - Department"
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.employees.aggregate([
    {
        $project: {
            name: 1,
            fullTitle: { $concat: ["$position", " - ", "$department"] }
        }
    }
])

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 10.2: String case conversion
 * 
 * Show employee names in uppercase and emails in lowercase
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.employees.aggregate([
    {
        $project: {
            nameUpper: { $toUpper: "$name" },
            position: { $toLower: "$position" }
        }
    }
])

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 10.3: Substring extraction
 * 
 * Extract the first name from each employee's full name
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.employees.aggregate([
    {
        $project: {
            fullName: "$name",
            firstName: {
                $arrayElemAt: [
                    { $split: ["$name", " "] },
                    0
                ]
            }
        }
    }
])


// ==========================================================================================
// PROBLEM 11: Conditional Expressions
// ==========================================================================================

/**
 * PROBLEM 11.1: Using $cond
 * 
 * Add a "salaryLevel" field: "High" if salary >= 90000, else "Standard"
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.employees.aggregate([
    {
        $project: {
            name: 1,
            salary: 1,
            salaryLevel: {
                $cond: {
                    if: { $gte: ["$salary", 90000] },
                    then: "High",
                    else: "Standard"
                }
            }
        }
    }
])

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 11.2: Using $switch
 * 
 * Categorize movie ratings: 9+ = "Masterpiece", 8.5-9 = "Excellent", 8-8.5 = "Great", else "Good"
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.movies.aggregate([
    {
        $project: {
            title: 1,
            rating: 1,
            category: {
                $switch: {
                    branches: [
                        { case: { $gte: ["$rating", 9] }, then: "Masterpiece" },
                        { case: { $gte: ["$rating", 8.5] }, then: "Excellent" },
                        { case: { $gte: ["$rating", 8] }, then: "Great" }
                    ],
                    default: "Good"
                }
            }
        }
    }
])

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 11.3: Using $ifNull
 * 
 * Show employee manager name, or "Top Level" if they have no manager
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.employees.aggregate([
    {
        $lookup: {
            from: "employees",
            localField: "manager",
            foreignField: "_id",
            as: "managerInfo"
        }
    },
    {
        $project: {
            name: 1,
            position: 1,
            managerName: {
                $ifNull: [
                    { $arrayElemAt: ["$managerInfo.name", 0] },
                    "Top Level"
                ]
            }
        }
    }
])


// ==========================================================================================
// PROBLEM 12: Advanced Aggregations
// ==========================================================================================

/**
 * PROBLEM 12.1: Running total
 * 
 * Calculate running total of sales by date
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.sales.aggregate([
    {
        $setWindowFields: {
            sortBy: { date: 1 },
            output: {
                runningTotal: {
                    $sum: { $multiply: ["$quantity", "$price"] },
                    window: { documents: ["unbounded", "current"] }
                }
            }
        }
    },
    { $project: { product: 1, date: 1, revenue: { $multiply: ["$quantity", "$price"] }, runningTotal: 1 } }
])

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 12.2: Ranking
 * 
 * Rank employees by salary within their department
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.employees.aggregate([
    {
        $setWindowFields: {
            partitionBy: "$department",
            sortBy: { salary: -1 },
            output: {
                salaryRank: { $rank: {} }
            }
        }
    },
    { $project: { name: 1, department: 1, salary: 1, salaryRank: 1 } }
])

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 12.3: Movie profitability
 * 
 * Calculate profit and ROI for each movie, sort by ROI
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.movies.aggregate([
    {
        $project: {
            title: 1,
            budget: "$boxOffice.budget",
            gross: "$boxOffice.gross",
            profit: { $subtract: ["$boxOffice.gross", "$boxOffice.budget"] },
            roi: {
                $multiply: [
                    { $divide: [
                        { $subtract: ["$boxOffice.gross", "$boxOffice.budget"] },
                        "$boxOffice.budget"
                    ]},
                    100
                ]
            }
        }
    },
    { $sort: { roi: -1 } }
])

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 12.4: Director statistics
 * 
 * For directors with multiple movies, calculate average rating and total gross
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.movies.aggregate([
    {
        $group: {
            _id: "$director",
            movieCount: { $sum: 1 },
            avgRating: { $avg: "$rating" },
            totalGross: { $sum: "$boxOffice.gross" },
            movies: { $push: "$title" }
        }
    },
    { $match: { movieCount: { $gt: 1 } } },
    { $sort: { avgRating: -1 } }
])

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 12.5: Sales dashboard
 * 
 * Create a comprehensive sales dashboard with:
 * - Total revenue
 * - Revenue by category
 * - Revenue by region
 * - Top 3 products
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.sales.aggregate([
    {
        $facet: {
            totalRevenue: [
                { 
                    $group: { 
                        _id: null, 
                        total: { $sum: { $multiply: ["$quantity", "$price"] } } 
                    } 
                }
            ],
            byCategory: [
                { 
                    $group: { 
                        _id: "$category", 
                        revenue: { $sum: { $multiply: ["$quantity", "$price"] } } 
                    } 
                },
                { $sort: { revenue: -1 } }
            ],
            byRegion: [
                { 
                    $group: { 
                        _id: "$region", 
                        revenue: { $sum: { $multiply: ["$quantity", "$price"] } } 
                    } 
                },
                { $sort: { revenue: -1 } }
            ],
            topProducts: [
                { 
                    $group: { 
                        _id: "$product", 
                        revenue: { $sum: { $multiply: ["$quantity", "$price"] } } 
                    } 
                },
                { $sort: { revenue: -1 } },
                { $limit: 3 }
            ]
        }
    }
])


// ==========================================================================================
// PROBLEM 13: $out and $merge
// ==========================================================================================

/**
 * PROBLEM 13.1: Save aggregation results to collection
 * 
 * Create a "departmentStats" collection with department statistics
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.employees.aggregate([
    {
        $group: {
            _id: "$department",
            employeeCount: { $sum: 1 },
            totalSalary: { $sum: "$salary" },
            avgSalary: { $avg: "$salary" }
        }
    },
    { $out: "departmentStats" }
])

// Verify
db.departmentStats.find()

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 13.2: Merge into existing collection
 * 
 * Update the departmentStats collection with latest data (upsert)
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.employees.aggregate([
    {
        $group: {
            _id: "$department",
            employeeCount: { $sum: 1 },
            totalSalary: { $sum: "$salary" },
            avgSalary: { $avg: "$salary" },
            lastUpdated: { $literal: new Date() }
        }
    },
    {
        $merge: {
            into: "departmentStats",
            on: "_id",
            whenMatched: "replace",
            whenNotMatched: "insert"
        }
    }
])


// ==========================================================================================
// CLEANUP
// ==========================================================================================

// Drop collections when done
// db.employees.drop()
// db.sales.drop()
// db.movies.drop()
// db.departmentStats.drop()

print("✅ All Aggregation practice problems completed!")
