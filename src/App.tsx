import React, { useState, useEffect } from 'react';
import { 
  FaUser, FaEnvelope, FaLock, FaImage, FaEye, FaEyeSlash, 
  FaUserCircle, FaCalendarAlt, FaChartBar, FaUsers, FaTrash, 
  FaEdit, FaSignOutAlt, FaHome, FaUserPlus, FaChartPie, 
  FaBell, FaCog, FaSearch, FaFilter, FaDownload,
  FaGraduationCap, FaBook, FaTrophy,
  FaCheckCircle, FaTimes, FaSpinner, FaIdCard,
  FaChartLine, FaUserGraduate,
  FaMoon, FaSun, FaExclamationTriangle,
  FaCode, FaLaptopCode, FaCertificate,
  FaShieldAlt, FaHistory, FaFileExport, FaUserShield
} from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API from './api';
import './App.css';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  matricNumber: string;
  dateStarted: string;
  department: string;
  role: string;
  level?: string;
  cgpa?: string;
  status?: string;
  lastActive?: string;
}

interface ActivityLog {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  type: 'login' | 'register' | 'update' | 'delete';
}

const App: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [forgotMatricMode, setForgotMatricMode] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [placeholderAnim, setPlaceholderAnim] = useState(false);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) setDarkMode(JSON.parse(savedDarkMode));

    // Auto-login if token exists
    const savedToken = localStorage.getItem('token');
    if (savedToken && !isAuthenticated) {
      setLoading(true);
      API.get('/auth/user')
        .then((res) => {
          setCurrentUser(res.data);
          setIsAuthenticated(true);
          toast.success('Welcome back! Auto-login successful');
        })
        .catch(() => {
          localStorage.removeItem('token');
          toast.error('Session expired. Please login again');
        })
        .finally(() => setLoading(false));
    }
  }, []);

  useEffect(() => {
    // Load data for admin
    if (isAuthenticated && currentUser?.role === 'admin') {
      loadAdminData();
    }
  }, [isAuthenticated, currentUser?.role, searchTerm, filterRole, filterStatus]);

  useEffect(() => {
    // Animate placeholders
    const interval = setInterval(() => {
      setPlaceholderAnim(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadAdminData = async () => {
    setLoadingUsers(true);
    try {
      const [usersRes, logsRes] = await Promise.all([
        API.get('/users', { params: { search: searchTerm, role: filterRole, status: filterStatus } }),
        API.get('/logs')
      ]);
      setAllUsers(usersRes.data);
      setActivityLogs(logsRes.data.map((log: any) => ({
        ...log,
        id: log._id,
        timestamp: new Date(log.timestamp).toLocaleString()
      })));
    } catch (err) {
      console.error('Failed to load admin data:', err);
      toast.error('Failed to load data. Please try again');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const res = await API.post('/auth/login', {
          email: formData.email,
          password: formData.password
        });
        localStorage.setItem('token', res.data.token);
        setCurrentUser(res.data.user);
        setIsAuthenticated(true);
        toast.success('🎉 Welcome back! Login successful');
      } else {
        await API.post('/auth/register', {
          ...formData,
          dateStarted: new Date().toISOString().split('T')[0],
          matricNumber: `CS/${new Date().getFullYear()}/${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
          department: 'Computer Science'
        });
        toast.success('🎉 Registration successful! Please log in.');
        setIsLogin(true);
        resetForm();
      }
    } catch (err: any) {
      toast.error(`❌ ${err.response?.data?.message || 'Error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '', lastName: '', email: '', password: '',
    });
    setImagePreview(null);
    setShowPassword(false);
    setForgotMatricMode(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('⚠️ Are you sure you want to delete this user?')) {
      try {
        await API.delete(`/users/${id}`);
        setAllUsers(allUsers.filter(u => u._id !== id));
        toast.success('✅ User deleted successfully');
        loadAdminData();
      } catch (err: any) {
        toast.error(`❌ ${err.response?.data?.message || 'Delete failed'}`);
      }
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser({ ...user });
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    if (editingUser) {
      try {
        await API.put(`/users/${editingUser._id}`, editingUser);
        setAllUsers(allUsers.map(u => u._id === editingUser._id ? editingUser : u));
        toast.success('✅ User updated successfully');
        setShowEditModal(false);
        setEditingUser(null);
        loadAdminData();
      } catch (err: any) {
        toast.error(`❌ ${err.response?.data?.message || 'Update failed'}`);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('📦 File size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        toast.info('📸 Profile image selected');
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
    toast.info(newMode ? '🌙 Dark mode enabled' : '☀️ Light mode enabled');
  };

  const exportUsers = async () => {
    try {
      const res = await API.get('/users/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cs_students.csv';
      a.click();
      toast.success('✅ Data exported successfully');
    } catch (err: any) {
      toast.error(`❌ ${err.response?.data?.message || 'Export failed'}`);
    }
  };

  const filtered = allUsers.filter(u => {
    const search = searchTerm.toLowerCase();
    const matchSearch = !searchTerm || 
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search) ||
      u.matricNumber.toLowerCase().includes(search);
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const stats = {
    total: allUsers.length,
    active: allUsers.filter(u => u.status === 'active').length,
    students: allUsers.filter(u => u.role === 'student').length,
    admins: allUsers.filter(u => u.role === 'admin').length,
  };

  const logout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setCurrentUser(null);
      setAllUsers([]);
      setActivityLogs([]);
      toast.info('👋 Logged out successfully');
    }
  };

  const placeholderTexts = {
    firstName: placeholderAnim ? 'John' : 'First Name',
    lastName: placeholderAnim ? 'Doe' : 'Last Name',
    email: placeholderAnim ? 'john.doe@university.edu' : 'Email Address',
    password: placeholderAnim ? '••••••••' : 'Password'
  };

  if (!isAuthenticated) {
    return (
      <div className={`auth-container ${darkMode ? 'dark-mode' : ''}`}>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={darkMode ? 'dark' : 'light'}
        />
        
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
        </div>

        <div className="auth-form-wrapper">
          <div className="auth-form-container">
            <div className="logo-section">
              <div className="logo pulse">
                <FaGraduationCap />
                <span>CS Portal</span>
              </div>
              <h1>{forgotMatricMode ? 'Retrieve Matric' : isLogin ? 'Welcome Back!' : 'Join CS Department'}</h1>
              <p>Computer Science Department Portal</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <div className="form-row">
                  <div className="form-group">
                    <FaUser className="input-icon" />
                    <input 
                      type="text" 
                      placeholder={placeholderTexts.firstName}
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      required
                      className={placeholderAnim ? 'placeholder-anim' : ''}
                    />
                  </div>
                  <div className="form-group">
                    <FaUser className="input-icon" />
                    <input 
                      type="text" 
                      placeholder={placeholderTexts.lastName}
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      required
                      className={placeholderAnim ? 'placeholder-anim' : ''}
                    />
                  </div>
                </div>
              )}
              
              <div className="form-group">
                <FaEnvelope className="input-icon" />
                <input 
                  type="email" 
                  placeholder={placeholderTexts.email}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  className={placeholderAnim ? 'placeholder-anim' : ''}
                />
              </div>

              <div className="form-group password-group">
                <FaLock className="input-icon" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder={placeholderTexts.password}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required={!forgotMatricMode}
                  className={placeholderAnim ? 'placeholder-anim' : ''}
                />
                {!forgotMatricMode && (
                  <button 
                    type="button" 
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                )}
              </div>

              {!isLogin && (
                <>
                  <div className="form-group file-group">
                    <FaImage className="input-icon" />
                    <label htmlFor="file-upload" className="file-label">
                      {imagePreview ? '✅ Image Selected' : '📸 Profile Image (Optional)'}
                    </label>
                    <input 
                      type="file" 
                      id="file-upload" 
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>

                  {imagePreview && (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Preview" />
                      <button 
                        type="button" 
                        onClick={() => {
                          setImagePreview(null);
                          toast.info('Image removed');
                        }}
                        className="remove-image"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}
                </>
              )}

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? (
                  <><FaSpinner className="spinner" /> Processing...</>
                ) : (
                  <>{isLogin ? <><FaSignOutAlt /> Sign In</> : <><FaUserPlus /> Create Account</>}</>
                )}
              </button>

              {isLogin && !forgotMatricMode && (
                <button 
                  type="button" 
                  className="link-btn"
                  onClick={() => {
                    setForgotMatricMode(true);
                    toast.info('Matric number recovery initiated');
                  }}
                >
                  <FaExclamationTriangle /> Forgot Matric Number?
                </button>
              )}

              <div className="auth-footer">
                <p>{isLogin ? "Don't have an account?" : "Already have an account?"}</p>
                <button 
                  type="button" 
                  className="switch-btn"
                  onClick={() => { 
                    setIsLogin(!isLogin); 
                    resetForm();
                    toast.info(isLogin ? 'Switched to registration' : 'Switched to login');
                  }}
                >
                  {isLogin ? 'Sign Up Now' : 'Sign In'}
                </button>
              </div>
            </form>

            <div className="auth-features">
              <div className="feature slide-up">
                <FaCode />
                <h4>Learn Coding</h4>
                <p>Master programming</p>
              </div>
              <div className="feature slide-up delay-1">
                <FaLaptopCode />
                <h4>Build Projects</h4>
                <p>Real applications</p>
              </div>
              <div className="feature slide-up delay-2">
                <FaCertificate />
                <h4>Get Certified</h4>
                <p>Recognition</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard ${darkMode ? 'dark-mode' : ''}`}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={darkMode ? 'dark' : 'light'}
      />
      
      {/* Sidebar */}
      <div className={`sidebar ${currentUser?.role === 'admin' ? 'admin-sidebar' : ''}`}>
        <div className="sidebar-header">
          <div className="user-profile">
            <div className="avatar">
              {currentUser?.firstName[0]}
            </div>
            <div className="user-info">
              <h3>{currentUser?.firstName} {currentUser?.lastName}</h3>
              <p>{currentUser?.email}</p>
              <span className={`badge ${currentUser?.role === 'admin' ? 'admin' : 'student'}`}>
                {currentUser?.role}
              </span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <a 
            href="#" 
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}
          >
            <FaHome /> Dashboard
          </a>
          {currentUser?.role === 'admin' && (
            <>
              <a 
                href="#" 
                className={activeTab === 'users' ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); setActiveTab('users'); }}
              >
                <FaUsers /> User Management
              </a>
              <a 
                href="#" 
                className={activeTab === 'analytics' ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); setActiveTab('analytics'); }}
              >
                <FaChartBar /> Analytics
              </a>
              <a 
                href="#" 
                className={activeTab === 'activity' ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); setActiveTab('activity'); }}
              >
                <FaHistory /> Activity Logs
              </a>
            </>
          )}
          {currentUser?.role === 'student' && (
            <>
              <a 
                href="#" 
                className={activeTab === 'courses' ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); setActiveTab('courses'); }}
              >
                <FaBook /> My Courses
              </a>
              <a 
                href="#" 
                className={activeTab === 'grades' ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); setActiveTab('grades'); }}
              >
                <FaTrophy /> My Grades
              </a>
              <a 
                href="#" 
                className={activeTab === 'profile' ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); setActiveTab('profile'); }}
              >
                <FaUserCircle /> My Profile
              </a>
            </>
          )}
          <a 
            href="#" 
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={(e) => { e.preventDefault(); setActiveTab('settings'); }}
          >
            <FaCog /> Settings
          </a>
        </nav>

        <div className="sidebar-footer">
          <button 
            onClick={toggleDarkMode} 
            style={{ 
              width: '100%', 
              marginBottom: '10px', 
              padding: '12px', 
              background: 'transparent', 
              border: '2px solid var(--gray-light)', 
              borderRadius: 'var(--border-radius)', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '10px', 
              color: darkMode ? 'white' : 'var(--dark)' 
            }}
          >
            {darkMode ? <FaSun /> : <FaMoon />}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button className="logout-btn" onClick={logout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="header">
          <div className="header-left">
            <h1>
              {activeTab === 'dashboard' && (currentUser?.role === 'admin' ? 'Admin Dashboard' : 'Student Dashboard')}
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'analytics' && 'Analytics'}
              {activeTab === 'activity' && 'Activity Logs'}
              {activeTab === 'settings' && 'Settings'}
              {activeTab === 'courses' && 'My Courses'}
              {activeTab === 'grades' && 'My Grades'}
              {activeTab === 'profile' && 'My Profile'}
            </h1>
            <p>Computer Science Department Portal</p>
          </div>
          <div className="header-right">
            <div className="notifications">
              <FaBell />
              <span className="notification-count">3</span>
            </div>
          </div>
        </div>

        <div className="content">
          {activeTab === 'dashboard' && currentUser?.role === 'admin' && (
            <>
              <div className="stats-cards">
                <div className="stat-card admin">
                  <div className="stat-icon total-users">
                    <FaUsers />
                  </div>
                  <div className="stat-info">
                    <h3>Total Users</h3>
                    <div className="stat-number">{stats.total}</div>
                    <div className="stat-change">+12% from last month</div>
                  </div>
                </div>

                <div className="stat-card admin">
                  <div className="stat-icon courses">
                    <FaUserGraduate />
                  </div>
                  <div className="stat-info">
                    <h3>Students</h3>
                    <div className="stat-number">{stats.students}</div>
                    <div className="stat-change">+8% from last month</div>
                  </div>
                </div>

                <div className="stat-card admin">
                  <div className="stat-icon active-users">
                    <FaCheckCircle />
                  </div>
                  <div className="stat-info">
                    <h3>Active Users</h3>
                    <div className="stat-number">{stats.active}</div>
                    <div className="stat-change">+15% from last month</div>
                  </div>
                </div>

                <div className="stat-card admin">
                  <div className="stat-icon revenue">
                    <FaUserShield />
                  </div>
                  <div className="stat-info">
                    <h3>Admins</h3>
                    <div className="stat-number">{stats.admins}</div>
                    <div className="stat-change">+5% from last month</div>
                  </div>
                </div>
              </div>

              <div className="content-grid">
                <div className="card admin-card">
                  <div className="card-header">
                    <h3>User Distribution</h3>
                    <div className="card-actions">
                      <FaFilter />
                      <FaDownload />
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="chart-placeholder">
                      <FaChartPie style={{ fontSize: '4rem', color: 'var(--primary)', marginBottom: '1rem' }} />
                      <p>Chart Visualization Area</p>
                    </div>
                  </div>
                </div>

                <div className="card admin-card">
                  <div className="card-header">
                    <h3>Recent Activity</h3>
                    <a href="#">View All</a>
                  </div>
                  <div className="card-body">
                    <div className="activities-list">
                      {loadingUsers ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}><FaSpinner /></div>
                      ) : (
                        activityLogs.slice(0, 5).map(log => (
                          <div key={log.id} className="activity-item">
                            <div className={`activity-icon ${
                              log.type === 'login' ? 'success' :
                              log.type === 'register' ? 'info' :
                              log.type === 'update' ? 'warning' : 'info'
                            }`}>
                              {log.type === 'login' && <FaSignOutAlt />}
                              {log.type === 'register' && <FaUserPlus />}
                              {log.type === 'update' && <FaEdit />}
                              {log.type === 'delete' && <FaTrash />}
                            </div>
                            <div className="activity-content">
                              <h4>{log.user}</h4>
                              <p>{log.action}</p>
                              <span className="activity-time">{log.timestamp}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'users' && currentUser?.role === 'admin' && (
            <div className="card admin-card full-width">
              <div className="card-header">
                <h3>All Users ({filtered.length})</h3>
                <div className="admin-actions">
                  <button className="btn-primary" onClick={exportUsers}>
                    <FaFileExport /> Export Data
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="table-controls">
                  <div className="search-bar">
                    <FaSearch />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                    <option value="all">All Roles</option>
                    <option value="student">Students</option>
                    <option value="admin">Admins</option>
                  </select>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="table-container">
                  {loadingUsers ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}><FaSpinner style={{ fontSize: '3rem' }} /></div>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Matric Number</th>
                          <th>Level</th>
                          <th>CGPA</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(user => (
                          <tr key={user._id}>
                            <td>
                              <div className="user-cell">
                                <div className="user-avatar">
                                  {user.firstName[0]}
                                </div>
                                <div>
                                  <strong>{user.firstName} {user.lastName}</strong>
                                  <br />
                                  <small>{user.email}</small>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontFamily: 'monospace' }}>{user.matricNumber}</td>
                            <td>{user.level || 'N/A'}</td>
                            <td><strong>{user.cgpa || 'N/A'}</strong></td>
                            <td>
                              <span className={`role-badge ${user.role}`}>
                                {user.role}
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge ${user.status}`}>
                                {user.status}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button className="action-btn edit" onClick={() => handleEdit(user)} title="Edit">
                                  <FaEdit />
                                </button>
                                <button className="action-btn delete" onClick={() => handleDelete(user._id)} title="Delete">
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && currentUser?.role === 'admin' && (
            <div className="content-grid">
              <div className="card admin-card full-width">
                <div className="card-header">
                  <h3>Performance Analytics</h3>
                </div>
                <div className="card-body">
                  <div className="chart-placeholder">
                    <FaChartLine style={{ fontSize: '4rem', color: 'var(--primary)', marginBottom: '1rem' }} />
                    <p>Analytics Chart - Performance Trends</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && currentUser?.role === 'admin' && (
            <div className="card admin-card full-width">
              <div className="card-header">
                <h3>Activity Logs</h3>
              </div>
              <div className="card-body">
                {loadingUsers ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}><FaSpinner style={{ fontSize: '3rem' }} /></div>
                ) : (
                  <div className="timeline">
                    {activityLogs.map(log => (
                      <div key={log.id} className="timeline-item">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <h4>{log.user}</h4>
                          <p>{log.action}</p>
                          <span className="timeline-time">{log.timestamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'courses' && currentUser?.role === 'student' && (
            <div className="content-grid">
              <div className="card full-width">
                <div className="card-header">
                  <h3>My Computer Science Courses</h3>
                </div>
                <div className="card-body">
                  <div className="course-list">
                    {[
                      { title: 'Data Structures & Algorithms', code: 'CS301', progress: 75 },
                      { title: 'Database Management', code: 'CS302', progress: 60 },
                      { title: 'Web Development', code: 'CS303', progress: 90 },
                    ].map((course) => (
                      <div key={course.code} className="course-item">
                        <div className="course-icon">
                          <FaBook />
                        </div>
                        <div className="course-info" style={{ flex: 1 }}>
                          <h4>{course.title}</h4>
                          <p>{course.code}</p>
                          <div style={{ width: '100%', height: '8px', background: 'var(--gray-light)', borderRadius: '4px', marginTop: '10px' }}>
                            <div style={{ width: `${course.progress}%`, height: '100%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', borderRadius: '4px' }}></div>
                          </div>
                        </div>
                        <div className="course-status">
                          <span className="status active">{course.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="card full-width">
              <div className="card-header">
                <h3>Settings</h3>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <h3>Appearance</h3>
                    <button onClick={toggleDarkMode} style={{ marginTop: '10px', padding: '12px 24px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--border-radius)', cursor: 'pointer' }}>
                      {darkMode ? <><FaSun /> Switch to Light Mode</> : <><FaMoon /> Switch to Dark Mode</>}
                    </button>
                  </div>
                  <div>
                    <h3>Account</h3>
                    <p style={{ color: 'var(--gray)' }}>Manage your account settings and preferences</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingUser && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: darkMode ? '#1f2937' : 'white',
            color: darkMode ? 'white' : 'black',
            borderRadius: 'var(--border-radius)',
            padding: '30px',
            width: '500px',
            maxWidth: '90%'
          }}>
            <h2 style={{ marginBottom: '20px' }}>Edit User</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>First Name</label>
                <input 
                  type="text"
                  value={editingUser.firstName}
                  onChange={(e) => setEditingUser({...editingUser, firstName: e.target.value})}
                  style={{ 
                    width: '100%', padding: '10px', 
                    border: '2px solid var(--gray-light)', 
                    borderRadius: '8px',
                    background: darkMode ? '#374151' : 'white',
                    color: darkMode ? 'white' : 'black'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Last Name</label>
                <input 
                  type="text"
                  value={editingUser.lastName}
                  onChange={(e) => setEditingUser({...editingUser, lastName: e.target.value})}
                  style={{ 
                    width: '100%', padding: '10px', 
                    border: '2px solid var(--gray-light)', 
                    borderRadius: '8px',
                    background: darkMode ? '#374151' : 'white',
                    color: darkMode ? 'white' : 'black'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Level</label>
                <select
                  value={editingUser.level || ''}
                  onChange={(e) => setEditingUser({...editingUser, level: e.target.value})}
                  style={{ 
                    width: '100%', padding: '10px', 
                    border: '2px solid var(--gray-light)', 
                    borderRadius: '8px',
                    background: darkMode ? '#374151' : 'white',
                    color: darkMode ? 'white' : 'black'
                  }}
                >
                  <option value="100">100</option>
                  <option value="200">200</option>
                  <option value="300">300</option>
                  <option value="400">400</option>
                  <option value="500">500</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Status</label>
                <select
                  value={editingUser.status || 'active'}
                  onChange={(e) => setEditingUser({...editingUser, status: e.target.value})}
                  style={{ 
                    width: '100%', padding: '10px', 
                    border: '2px solid var(--gray-light)', 
                    borderRadius: '8px',
                    background: darkMode ? '#374151' : 'white',
                    color: darkMode ? 'white' : 'black'
                  }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  onClick={saveEdit}
                  style={{ 
                    flex: 1, padding: '12px', 
                    background: 'var(--primary)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    fontWeight: '600' 
                  }}
                >
                  Save Changes
                </button>
                <button 
                  onClick={() => { setShowEditModal(false); setEditingUser(null); }}
                  style={{ 
                    flex: 1, padding: '12px', 
                    background: 'var(--gray)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    fontWeight: '600' 
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;