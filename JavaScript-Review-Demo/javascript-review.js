// 1. Create an object representing a student.
const student = {
  id: 101,
  name: "John Doe",
  major: "Computer Science",
  year: "Senior",
};

// 2. Create an array of courses.
const courses = [
  { code: "CS418", title: "Web Programming" },
  { code: "CS471", title: "Operating Systems" },
  { code: "CS432", title: "Web Science" },
];

// 3. Use destructuring to extract values from the student object.
const { name, major, year } = student;

// 4. Use map() to create a new array without changing the original array.
const formattedCourses = courses.map(
  ({ code, title }) => `${code}: ${title}`,
);

// 5–6. Use a function and a template literal to return a formatted message.
function formatStudentMessage(studentName, studentMajor, studentYear) {
  return `${studentName} is a ${studentYear.toLowerCase()} ${studentMajor} student.`;
}

const welcomeMessage = formatStudentMessage(name, major, year);

// 7. Convert an object to JSON and then convert the JSON back to an object.
const studentJson = JSON.stringify({ ...student, courses }, null, 2);
const parsedStudent = JSON.parse(studentJson);

// 8. Write an async function with try/catch.
async function buildStudentSummary() {
  try {
    // This promise simulates waiting for data from an API.
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!parsedStudent.name) {
      throw new Error("Student data is missing a name.");
    }

    return {
      message: welcomeMessage,
      courseNames: formattedCourses,
      json: studentJson,
    };
  } catch (error) {
    console.error("Unable to build the student summary:", error);
    throw error;
  }
}

// Optional browser practice: select elements with querySelector().
const button = document.querySelector("#showSummaryButton");
const status = document.querySelector("#status");
const resultCard = document.querySelector("#resultCard");
const studentMessage = document.querySelector("#studentMessage");
const courseList = document.querySelector("#courseList");
const jsonOutput = document.querySelector("#jsonOutput");

// Add a click event listener and display the result on the page.
if (
  !button ||
  !status ||
  !resultCard ||
  !studentMessage ||
  !courseList ||
  !jsonOutput
) {
  console.error("The student summary elements are missing from the page.");
} else {
  button.addEventListener("click", async () => {
    button.disabled = true;
    status.textContent = "Building summary...";

    try {
      const { message, courseNames, json } = await buildStudentSummary();

      studentMessage.textContent = message;

      const courseItems = courseNames.map((courseName) => {
        const listItem = document.createElement("li");
        listItem.textContent = courseName;
        return listItem;
      });

      courseList.replaceChildren(...courseItems);
      jsonOutput.textContent = json;
      resultCard.hidden = false;
      status.textContent = "Summary ready.";
    } catch (error) {
      status.textContent = `Error: ${error.message}`;
    } finally {
      button.disabled = false;
    }
  });
}

// These values are useful when demonstrating the browser console.
console.log("Original student object:", student);
console.log("New array created with map():", formattedCourses);
console.log("Parsed JSON object:", parsedStudent);
