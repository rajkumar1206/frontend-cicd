import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Todos.css';

function Todos() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userData || !token) {
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchTodos(parsedUser.username, token);
    }
  }, [navigate]);

  const fetchTodos = async (username, token) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/users/${username}/todos`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setTodos(response.data.data || []);
    } catch (err) {
      setError('Failed to load todos');
      console.error(err);
    }
  };

  const addTodo = async () => {
    if (!input.trim() || !user) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/users/${user.username}/todos`,
        { name: input },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setTodos([...todos, response.data.data]);
      setInput('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add todo');
    } finally {
      setLoading(false);
    }
  };

  const toggleTodo = async (index) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${process.env.REACT_APP_API_BASE_URL}/api/users/${user.username}/todos/${index}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Update the todo at the specific index
      const updatedTodos = [...todos];
      updatedTodos[index] = response.data.data;
      setTodos(updatedTodos);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update todo');
    }
  };

  const deleteTodo = async (index) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_API_BASE_URL}/api/users/${user.username}/todos/${index}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setTodos(todos.filter((_, i) => i !== index));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete todo');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      addTodo();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="todos-page">
      <div className="user-header">
        <span>Welcome, {user.username}</span>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      <div className="todos-container">
        <h1>My Todos</h1>

        {error && <p className="error-message">{error}</p>}

        <div className="input-section">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a new todo..."
            className="input-field"
            disabled={loading}
          />
          <button onClick={addTodo} className="add-button" disabled={loading}>
            {loading ? 'Adding...' : 'Add'}
          </button>
        </div>

        <div className="todos-list">
          {todos.length === 0 ? (
            <p className="no-todos">No todos yet. Add one to get started!</p>
          ) : (
            todos.map((todo, index) => (
              <div key={index} className="todo-item">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(index)}
                  className="todo-checkbox"
                />
                <span className={`todo-text ${todo.completed ? 'completed' : ''}`}>
                  {todo.name}
                </span>
                <button
                  onClick={() => deleteTodo(index)}
                  className="delete-button"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>

        {todos.length > 0 && (
          <div className="stats">
            <p>
              Completed: {todos.filter((t) => t.completed).length} / {todos.length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Todos;
