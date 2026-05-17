import type { Course } from '../types';

export const DEFAULT_COURSES: Course[] = [
  {
    id: 'course_python',
    title: 'Complete Python Pro Bootcamp',
    description: 'Learn Python from the basics to advanced topics.',
    defaultLanguage: 'python',
    playlistId: 'PL-osiE80TeTt2d9bfVyTiXJA-UTHn6WwU',
    initialCode: `# Fibonacci sequence
def fibonacci(n):
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result

numbers = fibonacci(10)
print("First 10:", numbers)
print("Total:", sum(numbers))
`,
    videos: [
      { id: 'YYXdXT2l-Gg', title: 'Python Tutorial for Beginners - Full Course', durationFormatted: '06:14:07', durationSeconds: 22447 },
      { id: 'kqtD5dpn9C8', title: 'Python Strings & String Manipulation', durationFormatted: '00:23:15', durationSeconds: 1395 },
      { id: 'W8KRzm-HUcc', title: 'Lists, Tuples, and Sets in Python', durationFormatted: '00:29:40', durationSeconds: 1780 },
      { id: 'daefaLgNkw0', title: 'Dictionaries - Working with Key-Value Pairs', durationFormatted: '00:15:22', durationSeconds: 922 },
      { id: 'qz0aGYrrlhU', title: 'Functions and Scope Deep Dive', durationFormatted: '00:25:10', durationSeconds: 1510 }
    ]
  },
  {
    id: 'course_sql',
    title: 'Advanced SQL & SQLite Mastery',
    description: 'Design schemas, write queries, and explore relational data.',
    defaultLanguage: 'sql',
    playlistId: 'PL08903FB7ACA1C2FB',
    initialCode: `-- Create a table
CREATE TABLE students (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    grade INTEGER
);

-- Insert some data
INSERT INTO students VALUES (1, 'Alice', 92);
INSERT INTO students VALUES (2, 'Bob', 85);
INSERT INTO students VALUES (3, 'Carol', 97);
INSERT INTO students VALUES (4, 'Dave', 78);

-- Query the results
SELECT name, grade FROM students ORDER BY grade DESC;
`,
    videos: [
      { id: 'HXV3zeQKqGY', title: 'SQL Tutorial - Full Database Course for Beginners', durationFormatted: '04:20:38', durationSeconds: 15638 },
      { id: '7S_tz1z_5bA', title: 'Relational Database Design Concepts', durationFormatted: '00:45:12', durationSeconds: 2712 },
      { id: 'zsjdggZg0Gg', title: 'Advanced JOINs and Subqueries', durationFormatted: '00:32:05', durationSeconds: 1925 }
    ]
  },
  {
    id: 'course_webdev',
    title: 'Full-Stack Web Dev & Live UI',
    description: 'Build web interfaces with live preview.',
    defaultLanguage: 'html',
    playlistId: 'PLTjRvDozrdlxEIuOBZkMAK5uiqp8rHUax',
    initialCode: `<style>
  .card {
    font-family: system-ui, sans-serif;
    background: linear-gradient(135deg, #22d3ee, #818cf8);
    color: white;
    padding: 2rem;
    border-radius: 12px;
    text-align: center;
    max-width: 400px;
    margin: 2rem auto;
  }
  .card button {
    background: white;
    color: #1e1b4b;
    border: none;
    padding: 8px 20px;
    font-weight: 600;
    border-radius: 6px;
    cursor: pointer;
    margin-top: 1rem;
  }
</style>

<div class="card">
  <h2>Live Preview</h2>
  <p>Edit the code and run to see changes here.</p>
  <button onclick="this.textContent = 'Nice!'">Click me</button>
</div>`,
    videos: [
      { id: 'mU6anWqZJcc', title: 'HTML & CSS Full Course - Beginner to Pro', durationFormatted: '05:30:20', durationSeconds: 19820 },
      { id: 'W6NZfCO5SIk', title: 'JavaScript Tutorial for Beginners', durationFormatted: '03:15:00', durationSeconds: 11700 }
    ]
  },
  {
    id: 'course_cpp',
    title: 'Modern C++ & Memory Engineering',
    description: 'Learn C++ fundamentals, pointers, and data structures.',
    defaultLanguage: 'cpp',
    playlistId: 'PLlrATfBNZ98dudnM48yfGUldqGD0S4FFb',
    initialCode: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> nums = {10, 20, 30, 40, 50};
    int sum = 0;

    for (int n : nums) {
        sum += n;
    }

    std::cout << "Count: " << nums.size() << std::endl;
    std::cout << "Sum: " << sum << std::endl;
    return 0;
}`,
    videos: [
      { id: '18c3MTX0PK0', title: 'C++ Programming Tutorial for Beginners', durationFormatted: '04:01:10', durationSeconds: 14470 },
      { id: 'wJ1L2nSIV1s', title: 'Pointers and References Explained', durationFormatted: '00:22:15', durationSeconds: 1335 }
    ]
  },
  {
    id: 'course_ruby',
    title: 'Elegant Ruby Scripting',
    description: 'Write expressive, object-oriented programs in Ruby.',
    defaultLanguage: 'ruby',
    initialCode: `# A simple class
class Student
  attr_reader :name, :score

  def initialize(name, score)
    @name = name
    @score = score
  end

  def passed?
    @score >= 60
  end
end

s = Student.new("Alice", 88)
puts "#{s.name}: #{s.passed? ? 'Passed' : 'Failed'}"
`,
    videos: [
      { id: 't_ispmWmdjY', title: 'Ruby Programming Language - Full Course', durationFormatted: '04:00:20', durationSeconds: 14420 }
    ]
  },
  {
    id: 'course_r',
    title: 'Data Analysis with R',
    description: 'Explore statistics and data visualization with R.',
    defaultLanguage: 'r',
    initialCode: `# Basic statistics
scores <- c(85, 92, 78, 95, 88, 73, 91)

print(paste("Mean:", round(mean(scores), 1)))
print(paste("Median:", median(scores)))
print(paste("Std Dev:", round(sd(scores), 1)))
`,
    videos: [
      { id: '_V8eKsto3Ug', title: 'R Programming Tutorial - Learn the Basics', durationFormatted: '02:10:45', durationSeconds: 7845 }
    ]
  }
];
