import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token"));

  // Function to fetch todos
  const fetchTodos = async () => {
    try {
      if (!token) {
        setTodos([]);
        return;
      }

      const res = await fetch("http://localhost:5000/todos", {
        headers: {
          "x-auth-token": token,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          // Token expired or invalid
          localStorage.removeItem("token");
          setToken(null);
        }
        setTodos([]);
        return;
      }

      const data = await res.json();
      setTodos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching todos:", err);
      setTodos([]);
    }
  };

  // Fetch todos when component mounts or token changes
  useEffect(() => {
    fetchTodos();
  }, [token]);

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setUsername("");
        setPassword("");
        fetchTodos();
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again.");
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setTodos([]);
  };

  // Add a new Todo
  const addTodo = async (e) => {
    e.preventDefault();

    if (!text.trim()) {
      setError("Task text cannot be empty.");
      return;
    }

    // Client-side duplicate check
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
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          setToken(null);
          setError("Session expired. Please login again.");
          return;
        }

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
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify({ completed: !completed }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          setToken(null);
          setError("Session expired. Please login again.");
          return;
        }
        throw new Error("Failed to update todo");
      }

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
      const res = await fetch(`http://localhost:5000/todos/${id}`, {
        method: "DELETE",
        headers: {
          "x-auth-token": token,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          setToken(null);
          setError("Session expired. Please login again.");
          return;
        }
        throw new Error("Failed to delete todo");
      }

      setTodos(todos.filter((todo) => todo._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="App">
      <h1>Todo App</h1>

      {!token ? (
        <form onSubmit={handleLogin} className="login-form">
          <h2>Login</h2>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username (admin)"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (password)"
          />
          <button type="submit">Login</button>
          {error && <p className="error">{error}</p>}
          <p className="login-hint">Use admin/password to login</p>
        </form>
      ) : (
        <>
          <div className="logout-container">
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
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
            {todos.length === 0 ? (
              <p className="no-tasks">No tasks yet. Add one!</p>
            ) : (
              todos.map((todo) => (
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
              ))
            )}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;
