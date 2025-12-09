import React, { useState, useEffect } from 'react';
import { 
  FaUser, FaEnvelope, FaLock, FaImage, FaEye, FaEyeSlash, 
  FaUserCircle, FaChartBar, FaUsers, FaTrash, 
  FaEdit, FaSignOutAlt, FaHome, FaUserPlus, FaChartPie, 
  FaBell, FaCog, FaSearch, FaFilter, FaDownload,
  FaGraduationCap, FaBook, FaTrophy,
  FaCheckCircle, FaTimes, FaSpinner,
  FaChartLine, FaUserGraduate,
  FaMoon, FaSun, FaExclamationTriangle,
  FaCode, FaLaptopCode, FaCertificate,
  FaHistory, FaFileExport, FaUserShield,
  FaPlus, FaMinus, FaCalculator, FaPercent, FaCalendarAlt, 
  FaIdCard, FaSchool, FaUniversity, FaCalendar, FaBookOpen,
  FaClock, FaStar, FaLocationArrow,
  FaPhone, FaAddressCard, FaUserTag, FaHeart
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
  department: string;
  role: string;
  level?: string;
  cgpa?: string;
  status?: string;
  lastActive?: string;
  createdAt?: string;
  studentId?: string;
  phone?: string;
  address?: string;
  dob?: string;
  gender?: string;
  registrationYear?: string;
  graduationYear?: string;
  advisor?: string;
}

interface Course {
  id: string;
  name: string;
  code: string;
  creditHours: number;
  grade: string;
  semester: string;
  year: string;
  instructor: string;
  room: string;
  schedule: string;
  description: string;
  progress: number;
  isFavorite: boolean;
}

const App: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Simplified registration form - ONLY FIRST NAME, LAST NAME, PASSWORD, IMAGE
  const [formData, setFormData] = useState({
    firstName: '', 
    lastName: '', 
    email: '', 
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Student dashboard states
  const [courses, setCourses] = useState<Course[]>([]);
  
  const [newCourse, setNewCourse] = useState({
    name: '',
    code: '',
    creditHours: 3,
    grade: '',
    semester: 'Fall',
    year: new Date().getFullYear().toString(),
    instructor: '',
    room: '',
    schedule: '',
    description: '',
  });
  
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedCourseForGrade, setSelectedCourseForGrade] = useState<Course | null>(null);
  const [newGrade, setNewGrade] = useState('');

  // Admin states
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) setDarkMode(JSON.parse(savedDarkMode));
    
    // Auto-login disabled: do not automatically authenticate using stored token.
    // If you want to re-enable auto-login later, restore the token check + API.get('/auth/user') logic here.
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentUser?.role === 'admin') {
      loadAdminData();
    }
  }, [isAuthenticated, currentUser?.role, searchTerm, filterRole, filterStatus]);

  // Calculate GPA
  const calculateGPA = () => {
    if (courses.length === 0) return '0.00';
    
    const gradePoints: { [key: string]: number } = {
      'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0
    };
    
    let totalPoints = 0;
    let totalCredits = 0;
    
    courses.forEach(course => {
      if (course.grade && gradePoints[course.grade.toUpperCase()] !== undefined && course.grade !== 'Not Graded') {
        totalPoints += gradePoints[course.grade.toUpperCase()] * course.creditHours;
        totalCredits += course.creditHours;
      }
    });
    
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  };

  // Student dashboard stats
  const studentStats = {
    totalCourses: courses.length,
    completedCourses: courses.filter(c => c.progress === 100).length,
    currentGPA: calculateGPA(),
    totalCreditHours: courses.reduce((sum, course) => sum + course.creditHours, 0),
    favoriteCourses: courses.filter(c => c.isFavorite).length,
  };

  // Admin stats
  const adminStats = {
    total: allUsers.length,
    active: allUsers.filter(u => u.status === 'active').length,
    students: allUsers.filter(u => u.role === 'student').length,
    admins: allUsers.filter(u => u.role === 'admin').length,
  };

  const loadAdminData = async () => {
    setLoadingUsers(true);
    try {
      // Fetch real admin data from backend
      const res = await API.get('/admin/users');
      let users = res.data;
      
      // Filter based on search and filters
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        users = users.filter((u: User) => 
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search)
        );
      }
      
      if (filterRole !== 'all') {
        users = users.filter((u: User) => u.role === filterRole);
      }
      
      if (filterStatus !== 'all') {
        users = users.filter((u: User) => u.status === filterStatus);
      }
      
      setAllUsers(users);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      toast.error('Failed to load admin data');
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
        
        const userData = res.data.user;
        setCurrentUser(userData);
        setIsAuthenticated(true);
        
        // Load admin data if admin
        if (userData.role === 'admin') {
          loadAdminData();
        }
        
        toast.success(userData.role === 'admin' ? '👋 Welcome Admin!' : '🎉 Welcome back! Login successful');
      } else {
        // Simplified registration - only essential fields
        const registrationData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: 'student',
          status: 'active'
        };
        
        const res = await API.post('/auth/register', registrationData);
        toast.success('🎉 Registration successful! Please log in.');
        setIsLogin(true);
        resetForm();
      }
    } catch (err: any) {
      console.error('Error:', err);
      toast.error(`❌ ${err.response?.data?.message || 'Error occurred. Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '', 
      lastName: '', 
      email: '', 
      password: '',
    });
    setImagePreview(null);
    setShowPassword(false);
  };

  // Student course functions
  const addCourse = () => {
    if (!newCourse.name || !newCourse.code) {
      toast.error('Please fill in course name and code');
      return;
    }
    
    const newCourseObj: Course = {
      id: Date.now().toString(),
      name: newCourse.name,
      code: newCourse.code,
      creditHours: newCourse.creditHours,
      grade: newCourse.grade || 'Not Graded',
      semester: newCourse.semester,
      year: newCourse.year,
      instructor: newCourse.instructor,
      room: newCourse.room,
      schedule: newCourse.schedule,
      description: newCourse.description,
      progress: 0,
      isFavorite: false
    };
    
    setCourses([...courses, newCourseObj]);
    setNewCourse({
      name: '',
      code: '',
      creditHours: 3,
      grade: '',
      semester: 'Fall',
      year: new Date().getFullYear().toString(),
      instructor: '',
      room: '',
      schedule: '',
      description: '',
    });
    toast.success(`✅ Added course: ${newCourse.name}`);
  };

  const deleteCourse = (id: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      setCourses(courses.filter(course => course.id !== id));
      toast.success('Course deleted successfully');
    }
  };

  const updateGrade = (courseId: string, grade: string) => {
    setCourses(courses.map(course => 
      course.id === courseId ? { ...course, grade } : course
    ));
    toast.success(`Grade updated to ${grade}`);
  };

  const updateProgress = (courseId: string, progress: number) => {
    setCourses(courses.map(course => 
      course.id === courseId ? { ...course, progress: Math.min(100, Math.max(0, progress)) } : course
    ));
  };

  const toggleFavorite = (courseId: string) => {
    setCourses(courses.map(course => 
      course.id === courseId ? { ...course, isFavorite: !course.isFavorite } : course
    ));
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

  // Admin functions
  const handleDeleteUser = async (id: string) => {
    if (window.confirm('⚠️ Are you sure you want to delete this user?')) {
      try {
        // Simulate delete
        setAllUsers(allUsers.filter(u => u._id !== id));
        toast.success('✅ User deleted successfully');
        loadAdminData();
      } catch (err: any) {
        console.error('Delete error:', err);
        toast.error('Delete failed');
      }
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser({ ...user });
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    if (editingUser) {
      try {
        // Simulate update
        setAllUsers(allUsers.map(u => u._id === editingUser._id ? editingUser : u));
        toast.success('✅ User updated successfully');
        setShowEditModal(false);
        setEditingUser(null);
        loadAdminData();
      } catch (err: any) {
        console.error('Update error:', err);
        toast.error('Update failed');
      }
    }
  };

  const exportUsers = async () => {
    try {
      const csvContent = "data:text/csv;charset=utf-8," 
        + "ID,First Name,Last Name,Email,Role,Department,Status\n"
        + allUsers.map(user => 
            `${user._id},${user.firstName},${user.lastName},${user.email},${user.role},${user.department},${user.status}`
          ).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "users.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('✅ Data exported successfully');
    } catch (err: any) {
      console.error('Export error:', err);
      toast.error('Export failed');
    }
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
    toast.info(newMode ? '🌙 Dark mode enabled' : '☀️ Light mode enabled');
  };

  const logout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setCurrentUser(null);
      setCourses([]);
      setAllUsers([]);
      toast.info('👋 Logged out successfully');
    }
  };

  // Grade options
  const gradeOptions = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', 'Not Graded'];

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
                <span>Academic Portal</span>
              </div>
              <h1>{isLogin ? 'Welcome Back!' : 'Create Account'}</h1>
              <p>Student & Admin Portal</p>
              
           
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <FaUser className="input-icon" />
                      <input 
                        type="text" 
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <FaUser className="input-icon" />
                      <input 
                        type="text" 
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <FaEnvelope className="input-icon" />
                    <input 
                      type="email" 
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group password-group">
                    <FaLock className="input-icon" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Create Password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                      minLength={6}
                    />
                    <button 
                      type="button" 
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>

                  <div className="form-group file-group">
                    <FaImage className="input-icon" />
                    <label htmlFor="file-upload" className="file-label">
                      {imagePreview ? '✅ Profile Image Selected' : '📸 Upload Profile Picture (Optional)'}
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
              
              {/* Login form */}
              {isLogin && (
                <>
                  <div className="form-group">
                    <FaEnvelope className="input-icon" />
                    <input 
                      type="email" 
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group password-group">
                    <FaLock className="input-icon" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                      minLength={6}
                    />
                    <button 
                      type="button" 
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </>
              )}

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? (
                  <><FaSpinner className="spinner" /> Processing...</>
                ) : (
                  <>{isLogin ? <><FaSignOutAlt /> Sign In</> : <><FaUserPlus /> Create Account</>}</>
                )}
              </button>

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
                  {isLogin ? 'Create New Account' : 'Sign In Instead'}
                </button>
              </div>
            </form>

            <div className="auth-features">
              <div className="feature slide-up">
                <FaBookOpen />
                <h4>Course Management</h4>
                <p>Track all your courses</p>
              </div>
              <div className="feature slide-up delay-1">
                <FaCalculator />
                <h4>GPA Calculator</h4>
                <p>Monitor your grades</p>
              </div>
              <div className="feature slide-up delay-2">
                <FaCertificate />
                <h4>Academic Progress</h4>
                <p>Visualize your journey</p>
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
      
      <div className={`sidebar ${currentUser?.role === 'admin' ? 'admin-sidebar' : ''}`}>
        <div className="sidebar-header">
          <div className="user-profile">
            <div className="avatar">
              {currentUser?.firstName?.[0] || 'U'}
            </div>
            <div className="user-info">
              <h3>{currentUser?.firstName} {currentUser?.lastName}</h3>
              <p>{currentUser?.email}</p>
              <span className={`badge ${currentUser?.role === 'admin' ? 'admin' : 'student'}`}>
                {currentUser?.role}
              </span>
              {currentUser?.role === 'student' && (
                <div style={{ marginTop: '5px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FaCalculator /> GPA: {studentStats.currentGPA}
                </div>
              )}
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
            </>
          )}
          
          {currentUser?.role === 'student' && (
            <>
              <a 
                href="#" 
                className={activeTab === 'courses' ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); setActiveTab('courses'); }}
              >
                <FaBookOpen /> My Courses
              </a>
              <a 
                href="#" 
                className={activeTab === 'grades' ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); setActiveTab('grades'); }}
              >
                <FaTrophy /> My Grades
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

      <div className="main-content">
        <div className="header">
          <div className="header-left">
            <h1>
              {activeTab === 'dashboard' && (currentUser?.role === 'admin' ? 'Admin Dashboard' : 'Student Dashboard')}
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'analytics' && 'Analytics'}
              {activeTab === 'settings' && 'Settings'}
              {activeTab === 'courses' && 'My Courses'}
              {activeTab === 'grades' && 'My Grades'}
            </h1>
            <p>{currentUser?.role === 'admin' ? 'Admin Portal' : 'Student Academic Portal'}</p>
          </div>
          <div className="header-right">
            <div className="notifications">
              <FaBell />
              <span className="notification-count">3</span>
            </div>
          </div>
        </div>

        <div className="content">
          {/* ADMIN DASHBOARD */}
          {activeTab === 'dashboard' && currentUser?.role === 'admin' && (
            <>
              <div className="stats-cards">
                <div className="stat-card admin">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                    <FaUsers />
                  </div>
                  <div className="stat-info">
                    <h3>Total Users</h3>
                    <div className="stat-number">{adminStats.total}</div>
                    <div className="stat-change">{adminStats.active} active</div>
                  </div>
                </div>

                <div className="stat-card admin">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
                    <FaUserGraduate />
                  </div>
                  <div className="stat-info">
                    <h3>Students</h3>
                    <div className="stat-number">{adminStats.students}</div>
                    <div className="stat-change">{adminStats.active} active</div>
                  </div>
                </div>

                <div className="stat-card admin">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}>
                    <FaUserShield />
                  </div>
                  <div className="stat-info">
                    <h3>Admins</h3>
                    <div className="stat-number">{adminStats.admins}</div>
                    <div className="stat-change">System administrators</div>
                  </div>
                </div>

                <div className="stat-card admin">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #43e97b, #38f9d7)' }}>
                    <FaCheckCircle />
                  </div>
                  <div className="stat-info">
                    <h3>Active Users</h3>
                    <div className="stat-number">{adminStats.active}</div>
                    <div className="stat-change">{Math.round((adminStats.active / adminStats.total) * 100)}% of total</div>
                  </div>
                </div>
              </div>

              <div className="content-grid">
                <div className="card admin-card">
                  <div className="card-header">
                    <h3>System Overview</h3>
                  </div>
                  <div className="card-body">
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                      <FaChartPie style={{ fontSize: '4rem', color: 'var(--primary)', marginBottom: '1rem', opacity: 0.7 }} />
                      <h3 style={{ marginBottom: '10px' }}>Welcome, {currentUser?.firstName}!</h3>
                      <p style={{ color: 'var(--gray)' }}>You are logged in as an administrator</p>
                      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button 
                          className="btn-primary"
                          onClick={() => setActiveTab('users')}
                        >
                          <FaUsers /> Manage Users
                        </button>
                        <button 
                          className="btn-secondary"
                          onClick={() => setActiveTab('analytics')}
                        >
                          <FaChartBar /> View Analytics
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card admin-card">
                  <div className="card-header">
                    <h3>Quick Actions</h3>
                  </div>
                  <div className="card-body">
                    <div className="quick-actions" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <button 
                        className="quick-action-btn"
                        onClick={() => setActiveTab('users')}
                      >
                        <FaUsers /> View All Users
                      </button>
                      <button 
                        className="quick-action-btn"
                        onClick={exportUsers}
                      >
                        <FaFileExport /> Export Data
                      </button>
                      <button 
                        className="quick-action-btn"
                        onClick={() => setActiveTab('settings')}
                      >
                        <FaCog /> System Settings
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* STUDENT DASHBOARD */}
          {activeTab === 'dashboard' && currentUser?.role === 'student' && (
            <>
              <div className="stats-cards">
                <div className="stat-card student">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                    <FaBookOpen />
                  </div>
                  <div className="stat-info">
                    <h3>Total Courses</h3>
                    <div className="stat-number">{studentStats.totalCourses}</div>
                    <div className="stat-change">{studentStats.favoriteCourses} favorites</div>
                  </div>
                </div>

                <div className="stat-card student">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
                    <FaCalculator />
                  </div>
                  <div className="stat-info">
                    <h3>Cumulative GPA</h3>
                    <div className="stat-number">{studentStats.currentGPA}</div>
                    <div className="stat-change">Out of 4.0</div>
                  </div>
                </div>

                <div className="stat-card student">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}>
                    <FaClock />
                  </div>
                  <div className="stat-info">
                    <h3>Credit Hours</h3>
                    <div className="stat-number">{studentStats.totalCreditHours}</div>
                    <div className="stat-change">Current semester</div>
                  </div>
                </div>

                <div className="stat-card student">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #43e97b, #38f9d7)' }}>
                    <FaPercent />
                  </div>
                  <div className="stat-info">
                    <h3>Progress</h3>
                    <div className="stat-number">{studentStats.completedCourses}/{studentStats.totalCourses}</div>
                    <div className="stat-change">Courses completed</div>
                  </div>
                </div>
              </div>

              <div className="content-grid">
                <div className="card student-card">
                  <div className="card-header">
                    <h3>Quick Actions</h3>
                  </div>
                  <div className="card-body">
                    <div className="quick-actions" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <button 
                        className="quick-action-btn"
                        onClick={() => setActiveTab('courses')}
                      >
                        <FaPlus /> Add New Course
                      </button>
                      <button 
                        className="quick-action-btn"
                        onClick={() => setActiveTab('grades')}
                      >
                        <FaTrophy /> View Grades
                      </button>
                    </div>
                  </div>
                </div>

                <div className="card student-card">
                  <div className="card-header">
                    <h3>Welcome, {currentUser?.firstName}!</h3>
                  </div>
                  <div className="card-body">
                    <div className="welcome-message">
                      <p>Track your academic progress, manage courses, and monitor your GPA all in one place.</p>
                      <div style={{ marginTop: '15px', display: 'flex', gap: '20px' }}>
                        <div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>Total Courses</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{studentStats.totalCourses}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>Current GPA</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{studentStats.currentGPA}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>Progress</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{studentStats.completedCourses}/{studentStats.totalCourses}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ADMIN USER MANAGEMENT */}
          {activeTab === 'users' && currentUser?.role === 'admin' && (
            <div className="card admin-card full-width">
              <div className="card-header">
                <h3>User Management ({allUsers.length})</h3>
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
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <FaSpinner className="spinner" style={{ fontSize: '3rem' }} />
                    </div>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Email</th>
                          <th>Department</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allUsers.map(user => (
                          <tr key={user._id}>
                            <td>
                              <div className="user-cell">
                                <div className="user-avatar">
                                  {user.firstName[0]}
                                </div>
                                <div>
                                  <strong>{user.firstName} {user.lastName}</strong>
                                  <br />
                                  <small>Level: {user.level || 'N/A'}</small>
                                </div>
                              </div>
                            </td>
                            <td>{user.email}</td>
                            <td>{user.department}</td>
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
                                <button className="action-btn edit" onClick={() => handleEditUser(user)} title="Edit">
                                  <FaEdit />
                                </button>
                                <button className="action-btn delete" onClick={() => handleDeleteUser(user._id)} title="Delete">
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

          {/* ADMIN ANALYTICS */}
          {activeTab === 'analytics' && currentUser?.role === 'admin' && (
            <div className="content-grid">
              <div className="card admin-card full-width">
                <div className="card-header">
                  <h3>System Analytics</h3>
                </div>
                <div className="card-body">
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <FaChartLine style={{ fontSize: '4rem', color: 'var(--primary)', marginBottom: '1rem', opacity: 0.7 }} />
                    <h3 style={{ marginBottom: '10px' }}>Analytics Dashboard</h3>
                    <p style={{ color: 'var(--gray)', marginBottom: '30px' }}>
                      View system statistics and user analytics
                    </p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '30px' }}>
                      <div className="stat-card mini">
                        <div className="stat-number">{adminStats.total}</div>
                        <div className="stat-label">Total Users</div>
                      </div>
                      <div className="stat-card mini">
                        <div className="stat-number">{adminStats.students}</div>
                        <div className="stat-label">Students</div>
                      </div>
                      <div className="stat-card mini">
                        <div className="stat-number">{adminStats.admins}</div>
                        <div className="stat-label">Admins</div>
                      </div>
                      <div className="stat-card mini">
                        <div className="stat-number">{adminStats.active}</div>
                        <div className="stat-label">Active</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MY COURSES - Student Only */}
          {activeTab === 'courses' && currentUser?.role === 'student' && (
            <div className="card full-width">
              <div className="card-header">
                <h3>My Courses ({courses.length})</h3>
              </div>
              <div className="card-body">
                {/* Add Course Form */}
                <div className="add-course-form" style={{ 
                  padding: '25px', 
                  background: 'var(--gray-light)', 
                  borderRadius: '12px', 
                  marginBottom: '25px' 
                }}>
                  <h3 style={{ marginBottom: '20px', color: 'var(--primary)' }}>Add New Course</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Course Name *</label>
                      <input 
                        type="text"
                        placeholder="e.g., Data Structures and Algorithms"
                        value={newCourse.name}
                        onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
                        style={{ 
                          width: '100%', 
                          padding: '12px', 
                          border: '2px solid var(--gray)', 
                          borderRadius: '8px',
                          fontSize: '0.95rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Course Code *</label>
                      <input 
                        type="text"
                        placeholder="e.g., CS201"
                        value={newCourse.code}
                        onChange={(e) => setNewCourse({...newCourse, code: e.target.value.toUpperCase()})}
                        style={{ 
                          width: '100%', 
                          padding: '12px', 
                          border: '2px solid var(--gray)', 
                          borderRadius: '8px',
                          fontSize: '0.95rem'
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Credit Hours</label>
                      <select
                        value={newCourse.creditHours}
                        onChange={(e) => setNewCourse({...newCourse, creditHours: parseInt(e.target.value)})}
                        style={{ 
                          width: '100%', 
                          padding: '12px', 
                          border: '2px solid var(--gray)', 
                          borderRadius: '8px',
                          fontSize: '0.95rem'
                        }}
                      >
                        {[1, 2, 3, 4, 5, 6].map(hours => (
                          <option key={hours} value={hours}>{hours} credit hour{hours > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Instructor</label>
                      <input 
                        type="text"
                        placeholder="e.g., Dr. Johnson"
                        value={newCourse.instructor}
                        onChange={(e) => setNewCourse({...newCourse, instructor: e.target.value})}
                        style={{ 
                          width: '100%', 
                          padding: '12px', 
                          border: '2px solid var(--gray)', 
                          borderRadius: '8px',
                          fontSize: '0.95rem'
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Grade</label>
                      <select
                        value={newCourse.grade}
                        onChange={(e) => setNewCourse({...newCourse, grade: e.target.value})}
                        style={{ 
                          width: '100%', 
                          padding: '12px', 
                          border: '2px solid var(--gray)', 
                          borderRadius: '8px',
                          fontSize: '0.95rem'
                        }}
                      >
                        {gradeOptions.map(grade => (
                          <option key={grade} value={grade}>{grade}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Description</label>
                      <textarea
                        placeholder="Brief description of the course..."
                        value={newCourse.description}
                        onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                        rows={3}
                        style={{ 
                          width: '100%', 
                          padding: '12px', 
                          border: '2px solid var(--gray)', 
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                  </div>
                  <button 
                    onClick={addCourse}
                    style={{ 
                      marginTop: '20px', 
                      padding: '12px 30px', 
                      background: 'var(--primary)', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '8px', 
                      cursor: 'pointer', 
                      fontWeight: '600',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px'
                    }}
                  >
                    <FaPlus /> Add Course
                  </button>
                </div>

                {/* Courses List */}
                <div className="courses-list">
                  {courses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--gray)' }}>
                      <FaBookOpen style={{ fontSize: '4rem', marginBottom: '15px', opacity: 0.5 }} />
                      <h3>No courses added yet</h3>
                      <p>Add your first course using the form above</p>
                    </div>
                  ) : (
                    <div className="course-grid">
                      {courses.map(course => (
                        <div key={course.id} className="course-card" style={{ 
                          border: course.isFavorite ? '2px solid gold' : '1px solid var(--gray-light)',
                          position: 'relative'
                        }}>
                          {course.isFavorite && (
                            <div style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                              color: 'gold',
                              fontSize: '1.2rem'
                            }}>
                              <FaStar />
                            </div>
                          )}
                          <div className="course-card-header">
                            <div className="course-code">{course.code}</div>
                            <div className="course-actions">
                              <button 
                                className="action-btn"
                                onClick={() => toggleFavorite(course.id)}
                                title={course.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                style={{ color: course.isFavorite ? 'gold' : 'var(--gray)' }}
                              >
                                <FaStar />
                              </button>
                              <button 
                                className="action-btn"
                                onClick={() => {
                                  setSelectedCourseForGrade(course);
                                  setNewGrade(course.grade);
                                  setShowGradeModal(true);
                                }}
                                title="Update Grade"
                              >
                                <FaEdit />
                              </button>
                              <button 
                                className="action-btn delete"
                                onClick={() => deleteCourse(course.id)}
                                title="Delete Course"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                          <div className="course-card-body">
                            <h4 style={{ marginBottom: '10px' }}>{course.name}</h4>
                            
                            <div className="course-details" style={{ marginBottom: '15px' }}>
                              <div className="course-detail">
                                <FaUserGraduate /> {course.instructor || 'Not specified'}
                              </div>
                              <div className="course-detail">
                                <FaClock /> {course.creditHours} Credits
                              </div>
                              <div className="course-detail">
                                <FaTrophy /> Grade: {course.grade}
                              </div>
                            </div>
                            
                            {course.description && (
                              <div style={{ 
                                marginBottom: '15px', 
                                padding: '10px', 
                                background: 'var(--gray-light)', 
                                borderRadius: '6px',
                                fontSize: '0.9rem'
                              }}>
                                {course.description}
                              </div>
                            )}
                            
                            <div style={{ marginTop: '15px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span>Progress</span>
                                <span>{course.progress}%</span>
                              </div>
                              <div style={{ 
                                width: '100%', 
                                height: '10px', 
                                background: 'var(--gray-light)', 
                                borderRadius: '5px' 
                              }}>
                                <div style={{ 
                                  width: `${course.progress}%`, 
                                  height: '100%', 
                                  background: course.progress === 100 ? 'linear-gradient(135deg, #43e97b, #38f9d7)' : 'linear-gradient(135deg, var(--primary), var(--secondary))', 
                                  borderRadius: '5px' 
                                }}></div>
                              </div>
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                marginTop: '10px' 
                              }}>
                                <button 
                                  onClick={() => updateProgress(course.id, course.progress - 10)}
                                  disabled={course.progress <= 0}
                                  style={{ 
                                    padding: '6px 12px', 
                                    background: 'var(--gray-light)', 
                                    border: 'none', 
                                    borderRadius: '4px', 
                                    cursor: course.progress <= 0 ? 'not-allowed' : 'pointer',
                                    fontSize: '0.9rem'
                                  }}
                                >
                                  <FaMinus /> Decrease
                                </button>
                                <button 
                                  onClick={() => updateProgress(course.id, course.progress + 10)}
                                  disabled={course.progress >= 100}
                                  style={{ 
                                    padding: '6px 12px', 
                                    background: 'var(--gray-light)', 
                                    border: 'none', 
                                    borderRadius: '4px', 
                                    cursor: course.progress >= 100 ? 'not-allowed' : 'pointer',
                                    fontSize: '0.9rem'
                                  }}
                                >
                                  <FaPlus /> Increase
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MY GRADES - Student Only */}
          {activeTab === 'grades' && currentUser?.role === 'student' && (
            <div className="card full-width">
              <div className="card-header">
                <h3>My Grades & Academic Performance</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div className="gpa-display" style={{ 
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))', 
                    padding: '10px 20px', 
                    borderRadius: '8px',
                    color: 'white'
                  }}>
                    <div style={{ fontSize: '0.9rem' }}>Current GPA</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{studentStats.currentGPA}</div>
                    <div style={{ fontSize: '0.8rem' }}>Out of 4.0</div>
                  </div>
                </div>
              </div>
              <div className="card-body">
                {/* Grade Summary */}
                <div className="grade-summary" style={{ 
                  marginBottom: '30px' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3>Academic Performance</h3>
                      <p>Based on {courses.length} courses, {studentStats.totalCreditHours} credit hours</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '30px' }}>
                        <div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>Completed</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{studentStats.completedCourses}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>In Progress</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{studentStats.totalCourses - studentStats.completedCourses}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>Credit Hours</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{studentStats.totalCreditHours}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grades Table */}
                <div className="grades-table-container">
                  {courses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray)' }}>
                      <FaTrophy style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.5 }} />
                      <h3>No courses added yet</h3>
                      <p>Add courses in "My Courses" tab to see your grades here</p>
                    </div>
                  ) : (
                    <table className="grades-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--gray-light)' }}>
                          <th style={{ padding: '15px', textAlign: 'left' }}>Course</th>
                          <th style={{ padding: '15px', textAlign: 'left' }}>Code</th>
                          <th style={{ padding: '15px', textAlign: 'left' }}>Credits</th>
                          <th style={{ padding: '15px', textAlign: 'left' }}>Grade</th>
                          <th style={{ padding: '15px', textAlign: 'left' }}>Update Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.map(course => {
                          const gradePoints: { [key: string]: number } = {
                            'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
                            'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0
                          };
                          const points = gradePoints[course.grade.toUpperCase()] || 0;
                          
                          return (
                            <tr key={course.id} style={{ borderBottom: '1px solid var(--gray-light)' }}>
                              <td style={{ padding: '15px' }}>{course.name}</td>
                              <td style={{ padding: '15px' }}>{course.code}</td>
                              <td style={{ padding: '15px' }}>{course.creditHours}</td>
                              <td style={{ padding: '15px' }}>
                                <span className={`grade-badge ${course.grade}`}>
                                  {course.grade}
                                </span>
                              </td>
                              <td style={{ padding: '15px' }}>
                                <select
                                  value={course.grade}
                                  onChange={(e) => updateGrade(course.id, e.target.value)}
                                  style={{ 
                                    padding: '8px 12px', 
                                    border: '2px solid var(--gray)', 
                                    borderRadius: '6px',
                                    fontSize: '0.9rem'
                                  }}
                                >
                                  {gradeOptions.map(grade => (
                                    <option key={grade} value={grade}>{grade}</option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Grade Distribution Chart */}
                {courses.length > 0 && (
                  <div className="grade-distribution" style={{ marginTop: '40px', padding: '20px', background: 'var(--gray-light)', borderRadius: '10px' }}>
                    <h4 style={{ marginBottom: '20px' }}>Grade Distribution</h4>
                    <div style={{ display: 'flex', gap: '15px', marginTop: '10px', alignItems: 'flex-end', height: '150px' }}>
                      {gradeOptions.slice(0, -1).map(grade => {
                        const count = courses.filter(c => c.grade === grade).length;
                        const percentage = courses.length > 0 ? (count / courses.length * 100) : 0;
                        const height = Math.max(30, percentage * 1.2);
                        
                        return (
                          <div key={grade} style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ 
                              height: `${height}px`, 
                              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                              borderRadius: '6px 6px 0 0',
                              position: 'relative',
                              transition: 'height 0.5s ease'
                            }}>
                              <div style={{ 
                                position: 'absolute', 
                                top: '-25px', 
                                left: '0', 
                                right: '0', 
                                fontWeight: 'bold' 
                              }}>
                                {count}
                              </div>
                            </div>
                            <div style={{ marginTop: '10px' }}>
                              <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{grade}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>
                                {percentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SETTINGS - Both Admin and Student */}
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
                    <h3>Account Information</h3>
                    <div style={{ 
                      padding: '15px', 
                      background: 'var(--gray-light)', 
                      borderRadius: 'var(--border-radius)',
                      marginTop: '10px'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                        <div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>Name</div>
                          <div style={{ fontWeight: 'bold' }}>{currentUser?.firstName} {currentUser?.lastName}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>Email</div>
                          <div style={{ fontWeight: 'bold' }}>{currentUser?.email}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>Role</div>
                          <div style={{ fontWeight: 'bold' }}>
                            <span className={`badge ${currentUser?.role === 'admin' ? 'admin' : 'student'}`}>
                              {currentUser?.role}
                            </span>
                          </div>
                        </div>
                        {currentUser?.role === 'student' && (
                          <div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>Current GPA</div>
                            <div style={{ fontWeight: 'bold' }}>{studentStats.currentGPA}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3>System</h3>
                    <p style={{ color: 'var(--gray)' }}>Manage your account settings and preferences</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grade Update Modal */}
      {showGradeModal && selectedCourseForGrade && (
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
            width: '400px',
            maxWidth: '90%'
          }}>
            <h2 style={{ marginBottom: '20px' }}>Update Grade</h2>
            <div style={{ marginBottom: '20px' }}>
              <p><strong>Course:</strong> {selectedCourseForGrade.name} ({selectedCourseForGrade.code})</p>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Select Grade</label>
              <select
                value={newGrade}
                onChange={(e) => setNewGrade(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '2px solid var(--gray-light)', 
                  borderRadius: '8px',
                  background: darkMode ? '#374151' : 'white',
                  color: darkMode ? 'white' : 'black'
                }}
              >
                {gradeOptions.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                onClick={() => {
                  updateGrade(selectedCourseForGrade.id, newGrade);
                  setShowGradeModal(false);
                  setSelectedCourseForGrade(null);
                }}
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
                Update Grade
              </button>
              <button 
                onClick={() => { 
                  setShowGradeModal(false); 
                  setSelectedCourseForGrade(null);
                }}
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
      )}

      {/* Edit User Modal */}
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
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Email</label>
                <input 
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
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
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                  style={{ 
                    width: '100%', padding: '10px', 
                    border: '2px solid var(--gray-light)', 
                    borderRadius: '8px',
                    background: darkMode ? '#374151' : 'white',
                    color: darkMode ? 'white' : 'black'
                  }}
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
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