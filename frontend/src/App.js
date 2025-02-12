import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  // Fetch todos when the component mounts
  useEffect(() => {
    fetch("http://localhost:5000/todos")
      .then((res) => res.json())
      .then((data) => setTodos(data))
      .catch((err) => console.error(err));
  }, []);

  // Add a new Todo with duplicate validation
  const addTodo = async (e) => {
    e.preventDefault();

    if (!text.trim()) {
      setError("Task text cannot be empty.");
      return;
    }

    // Client-side duplicate check (case-insensitive)
    const duplicate = todos.find(
      (todo) => todo.text.trim().toLowerCase() === text.trim().toLowerCase()
    );
    if (duplicate) {
      setError("Task already exists.");
      return;
    }
    setError("");

    try {
      const res = await fetch("http://localhost:5000/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || "Error creating task.");
        return;
      }
      const newTodo = await res.json();
      setTodos((prevTodos) => [...prevTodos, newTodo]);
      setText("");
    } catch (err) {
      console.error(err);
      setError("Error creating task.");
    }
  };

  const toggleComplete = async (id, completed) => {
    try {
      const res = await fetch(`http://localhost:5000/todos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed }),
      });
      const updatedTodo = await res.json();
      setTodos((prevTodos) =>
        prevTodos.map((todo) => (todo._id === id ? updatedTodo : todo))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await fetch(`http://localhost:5000/todos/${id}`, {
        method: "DELETE",
      });
      setTodos(todos.filter((todo) => todo._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="App">
      <h1>Todo App</h1>
      <form onSubmit={addTodo}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter task"
        />
        {error && <p className="error">{error}</p>}
        <button type="submit">Add Task</button>
      </form>
      <ul className="todo-list">
        {todos.map((todo) => (
          <li key={todo._id}>
            <span
              className={`todo-text ${todo.completed ? "completed" : ""}`}
              onClick={() => toggleComplete(todo._id, todo.completed)}
            >
              {todo.text}
            </span>
            <div className="todo-buttons">
              <button
                className="complete-btn"
                onClick={() => toggleComplete(todo._id, todo.completed)}
              >
                {todo.completed ? "Undo" : "Complete"}
              </button>
              <button
                className="delete-btn"
                onClick={() => deleteTodo(todo._id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
