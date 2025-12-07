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
  FaPlus, FaMinus, FaCalculator, FaPercent, FaCalendarAlt, FaIdCard
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
}

interface Course {
  id: string;
  name: string;
  code: string;
  creditHours: number;
  grade: string;
  semester: string;
  progress: number;
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

  // Student dashboard states
  const [courses, setCourses] = useState<Course[]>([
    { id: '1', name: 'Data Structures', code: 'CS201', creditHours: 3, grade: 'A', semester: 'Fall 2024', progress: 85 },
    { id: '2', name: 'Database Systems', code: 'CS202', creditHours: 3, grade: 'B+', semester: 'Fall 2024', progress: 70 },
    { id: '3', name: 'Web Development', code: 'CS203', creditHours: 4, grade: 'A-', semester: 'Fall 2024', progress: 90 },
  ]);
  const [newCourse, setNewCourse] = useState({
    name: '',
    code: '',
    creditHours: 3,
    grade: '',
    semester: 'Fall 2024'
  });
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedCourseForGrade, setSelectedCourseForGrade] = useState<Course | null>(null);
  const [newGrade, setNewGrade] = useState('');
  const [semesters, setSemesters] = useState<string[]>(['Fall 2024', 'Spring 2024', 'Fall 2023', 'Spring 2023']);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) setDarkMode(JSON.parse(savedDarkMode));

    const savedToken = localStorage.getItem('token');
    if (savedToken && !isAuthenticated) {
      setLoading(true);
      API.get('/auth/user')
        .then((res) => {
          console.log('Auto-login response:', res.data);
          setCurrentUser(res.data);
          setIsAuthenticated(true);
          toast.success('Welcome back! Auto-login successful');
        })
        .catch((err) => {
          console.error('Auto-login error:', err);
          localStorage.removeItem('token');
          toast.error('Session expired. Please login again');
        })
        .finally(() => setLoading(false));
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentUser?.role === 'admin') {
      loadAdminData();
    }
  }, [isAuthenticated, currentUser?.role, searchTerm, filterRole, filterStatus]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderAnim(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Calculate GPA
  const calculateGPA = () => {
    if (courses.length === 0) return 0;
    
    const gradePoints: { [key: string]: number } = {
      'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0
    };
    
    let totalPoints = 0;
    let totalCredits = 0;
    
    courses.forEach(course => {
      if (course.grade && gradePoints[course.grade.toUpperCase()] !== undefined) {
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
    semesterGPA: (() => {
      const currentSemesterCourses = courses.filter(c => c.semester === 'Fall 2024');
      if (currentSemesterCourses.length === 0) return '0.00';
      
      const gradePoints: { [key: string]: number } = {
        'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0
      };
      
      let totalPoints = 0;
      let totalCredits = 0;
      
      currentSemesterCourses.forEach(course => {
        if (course.grade && gradePoints[course.grade.toUpperCase()] !== undefined) {
          totalPoints += gradePoints[course.grade.toUpperCase()] * course.creditHours;
          totalCredits += course.creditHours;
        }
      });
      
      return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
    })()
  };

  const loadAdminData = async () => {
    setLoadingUsers(true);
    try {
      console.log('Loading admin data...');
      const [usersRes, logsRes] = await Promise.all([
        API.get('/users', { params: { search: searchTerm, role: filterRole, status: filterStatus } }),
        API.get('/logs')
      ]);
      console.log('Users response:', usersRes.data);
      console.log('Logs response:', logsRes.data);
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
        console.log('Attempting login with:', { email: formData.email });
        const res = await API.post('/auth/login', {
          email: formData.email,
          password: formData.password
        });
        console.log('Login response:', res.data);
        localStorage.setItem('token', res.data.token);
        setCurrentUser(res.data.user);
        setIsAuthenticated(true);
        toast.success('🎉 Welcome back! Login successful');
      } else {
        console.log('Attempting registration with:', formData);
        const res = await API.post('/auth/register', formData);
        console.log('Registration response:', res.data);
        toast.success('🎉 Registration successful! Please log in.');
        setIsLogin(true);
        resetForm();
      }
    } catch (err: any) {
      console.error('Full error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      if (err.code === 'ECONNABORTED') {
        toast.error('⏰ Request timeout. Please try again.');
      } else if (!err.response) {
        toast.error('🌐 Network error. Please check your internet connection.');
      } else if (err.response?.status === 404) {
        toast.error('🔍 Backend endpoint not found.');
      } else if (err.response?.status === 500) {
        toast.error('⚙️ Server error. Please try again later.');
      } else {
        toast.error(`❌ ${err.response?.data?.message || 'Error occurred. Please try again.'}`);
      }
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
        console.error('Delete error:', err);
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
        console.error('Update error:', err);
        toast.error(`❌ ${err.response?.data?.message || 'Update failed'}`);
      }
    }
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
      progress: 0
    };
    
    setCourses([...courses, newCourseObj]);
    setNewCourse({ name: '', code: '', creditHours: 3, grade: '', semester: 'Fall 2024' });
    toast.success(`Added course: ${newCourse.name}`);
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
      a.download = 'users.csv';
      a.click();
      toast.success('✅ Data exported successfully');
    } catch (err: any) {
      console.error('Export error:', err);
      toast.error(`❌ ${err.response?.data?.message || 'Export failed'}`);
    }
  };

  const filtered = allUsers.filter(u => {
    const search = searchTerm.toLowerCase();
    const matchSearch = !searchTerm || 
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search);
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
                <span>CS Portal</span>
              </div>
              <h1>{isLogin ? 'Welcome Back!' : 'Join CS Department'}</h1>
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
                  required
                  className={placeholderAnim ? 'placeholder-anim' : ''}
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
              {currentUser?.role === 'student' && (
                <div style={{ marginTop: '5px', fontSize: '0.8rem' }}>
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

          {/* STUDENT DASHBOARD */}
          {activeTab === 'dashboard' && currentUser?.role === 'student' && (
            <>
              <div className="stats-cards">
                <div className="stat-card student">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                    <FaBook />
                  </div>
                  <div className="stat-info">
                    <h3>Total Courses</h3>
                    <div className="stat-number">{studentStats.totalCourses}</div>
                    <div className="stat-change">{studentStats.completedCourses} completed</div>
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
                    <FaCalendarAlt />
                  </div>
                  <div className="stat-info">
                    <h3>Semester GPA</h3>
                    <div className="stat-number">{studentStats.semesterGPA}</div>
                    <div className="stat-change">Fall 2024</div>
                  </div>
                </div>

                <div className="stat-card student">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #43e97b, #38f9d7)' }}>
                    <FaPercent />
                  </div>
                  <div className="stat-info">
                    <h3>Credit Hours</h3>
                    <div className="stat-number">{studentStats.totalCreditHours}</div>
                    <div className="stat-change">Current load</div>
                  </div>
                </div>
              </div>

              <div className="content-grid">
                <div className="card student-card">
                  <div className="card-header">
                    <h3>Quick Actions</h3>
                  </div>
                  <div className="card-body">
                    <div className="quick-actions">
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
                        <FaEdit /> Update Grades
                      </button>
                      <button 
                        className="quick-action-btn"
                        onClick={() => setActiveTab('profile')}
                      >
                        <FaUserCircle /> View Profile
                      </button>
                    </div>
                  </div>
                </div>

                <div className="card student-card">
                  <div className="card-header">
                    <h3>Upcoming Deadlines</h3>
                  </div>
                  <div className="card-body">
                    <div className="deadlines-list">
                      <div className="deadline-item">
                        <div className="deadline-date">Dec 15</div>
                        <div className="deadline-content">
                          <h4>Data Structures Final</h4>
                          <p>CS201 - 10:00 AM</p>
                        </div>
                      </div>
                      <div className="deadline-item">
                        <div className="deadline-date">Dec 18</div>
                        <div className="deadline-content">
                          <h4>Database Project Due</h4>
                          <p>CS202 - 11:59 PM</p>
                        </div>
                      </div>
                      <div className="deadline-item">
                        <div className="deadline-date">Dec 20</div>
                        <div className="deadline-content">
                          <h4>Web Development Exam</h4>
                          <p>CS203 - 2:00 PM</p>
                        </div>
                      </div>
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
                          <th>Email</th>
                          <th>Department</th>
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
                                  <small>Joined: {new Date(user.lastActive || '').toLocaleDateString()}</small>
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

          {/* MY COURSES - Student Section */}
          {activeTab === 'courses' && currentUser?.role === 'student' && (
            <div className="card full-width">
              <div className="card-header">
                <h3>My Courses ({courses.length})</h3>
                <button 
                  className="btn-primary"
                  onClick={() => setShowCourseModal(true)}
                >
                  <FaPlus /> Add New Course
                </button>
              </div>
              <div className="card-body">
                {/* Add Course Form */}
                <div className="add-course-form" style={{ 
                  padding: '20px', 
                  background: 'var(--gray-light)', 
                  borderRadius: '10px', 
                  marginBottom: '20px' 
                }}>
                  <h4 style={{ marginBottom: '15px' }}>Add New Course</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Course Name</label>
                      <input 
                        type="text"
                        placeholder="e.g., Data Structures"
                        value={newCourse.name}
                        onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
                        style={{ 
                          width: '100%', 
                          padding: '10px', 
                          border: '2px solid var(--gray)', 
                          borderRadius: '8px' 
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Course Code</label>
                      <input 
                        type="text"
                        placeholder="e.g., CS201"
                        value={newCourse.code}
                        onChange={(e) => setNewCourse({...newCourse, code: e.target.value.toUpperCase()})}
                        style={{ 
                          width: '100%', 
                          padding: '10px', 
                          border: '2px solid var(--gray)', 
                          borderRadius: '8px' 
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Credit Hours</label>
                      <select
                        value={newCourse.creditHours}
                        onChange={(e) => setNewCourse({...newCourse, creditHours: parseInt(e.target.value)})}
                        style={{ 
                          width: '100%', 
                          padding: '10px', 
                          border: '2px solid var(--gray)', 
                          borderRadius: '8px' 
                        }}
                      >
                        {[1, 2, 3, 4, 5].map(hours => (
                          <option key={hours} value={hours}>{hours} credit hour{hours > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Semester</label>
                      <select
                        value={newCourse.semester}
                        onChange={(e) => setNewCourse({...newCourse, semester: e.target.value})}
                        style={{ 
                          width: '100%', 
                          padding: '10px', 
                          border: '2px solid var(--gray)', 
                          borderRadius: '8px' 
                        }}
                      >
                        {semesters.map(sem => (
                          <option key={sem} value={sem}>{sem}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button 
                    onClick={addCourse}
                    style={{ 
                      marginTop: '15px', 
                      padding: '10px 20px', 
                      background: 'var(--primary)', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '8px', 
                      cursor: 'pointer', 
                      fontWeight: '600' 
                    }}
                  >
                    <FaPlus /> Add Course
                  </button>
                </div>

                {/* Courses List */}
                <div className="courses-list">
                  {courses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray)' }}>
                      <FaBook style={{ fontSize: '3rem', marginBottom: '10px' }} />
                      <h3>No courses added yet</h3>
                      <p>Add your first course using the form above</p>
                    </div>
                  ) : (
                    <div className="course-grid">
                      {courses.map(course => (
                        <div key={course.id} className="course-card">
                          <div className="course-card-header">
                            <div className="course-code">{course.code}</div>
                            <div className="course-actions">
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
                            <h4>{course.name}</h4>
                            <div className="course-details">
                              <div className="course-detail">
                                <FaCalendarAlt /> {course.semester}
                              </div>
                              <div className="course-detail">
                                <FaPercent /> {course.creditHours} Credits
                              </div>
                              <div className="course-detail">
                                <FaTrophy /> Grade: {course.grade}
                              </div>
                            </div>
                            <div style={{ marginTop: '15px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span>Progress</span>
                                <span>{course.progress}%</span>
                              </div>
                              <div style={{ 
                                width: '100%', 
                                height: '8px', 
                                background: 'var(--gray-light)', 
                                borderRadius: '4px' 
                              }}>
                                <div style={{ 
                                  width: `${course.progress}%`, 
                                  height: '100%', 
                                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))', 
                                  borderRadius: '4px' 
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
                                    padding: '5px 10px', 
                                    background: 'var(--gray-light)', 
                                    border: 'none', 
                                    borderRadius: '4px', 
                                    cursor: course.progress <= 0 ? 'not-allowed' : 'pointer' 
                                  }}
                                >
                                  <FaMinus />
                                </button>
                                <button 
                                  onClick={() => updateProgress(course.id, course.progress + 10)}
                                  disabled={course.progress >= 100}
                                  style={{ 
                                    padding: '5px 10px', 
                                    background: 'var(--gray-light)', 
                                    border: 'none', 
                                    borderRadius: '4px', 
                                    cursor: course.progress >= 100 ? 'not-allowed' : 'pointer' 
                                  }}
                                >
                                  <FaPlus />
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

          {/* MY GRADES - Student Section */}
          {activeTab === 'grades' && currentUser?.role === 'student' && (
            <div className="card full-width">
              <div className="card-header">
                <h3>My Grades & GPA</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div className="gpa-display">
                    <span style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>Current GPA:</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                      {studentStats.currentGPA}
                    </span>
                  </div>
                </div>
              </div>
              <div className="card-body">
                {/* Grade Summary */}
                <div className="grade-summary" style={{ 
                  padding: '20px', 
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))', 
                  borderRadius: '10px', 
                  color: 'white', 
                  marginBottom: '20px' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0 }}>Academic Performance</h3>
                      <p>Based on {courses.length} courses, {studentStats.totalCreditHours} credit hours</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{studentStats.currentGPA}</div>
                      <div>Out of 4.0</div>
                    </div>
                  </div>
                </div>

                {/* Grades Table */}
                <div className="grades-table-container">
                  <table className="grades-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--gray-light)' }}>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Course</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Code</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Semester</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Credits</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Grade</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Grade Points</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
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
                            <td style={{ padding: '12px' }}>{course.name}</td>
                            <td style={{ padding: '12px' }}>{course.code}</td>
                            <td style={{ padding: '12px' }}>{course.semester}</td>
                            <td style={{ padding: '12px' }}>{course.creditHours}</td>
                            <td style={{ padding: '12px' }}>
                              <span className={`grade-badge ${course.grade}`}>
                                {course.grade}
                              </span>
                            </td>
                            <td style={{ padding: '12px' }}>{(points * course.creditHours).toFixed(1)}</td>
                            <td style={{ padding: '12px' }}>
                              <select
                                value={course.grade}
                                onChange={(e) => updateGrade(course.id, e.target.value)}
                                style={{ 
                                  padding: '5px 10px', 
                                  border: '2px solid var(--gray)', 
                                  borderRadius: '4px' 
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
                </div>

                {/* Grade Distribution */}
                <div className="grade-distribution" style={{ marginTop: '30px' }}>
                  <h4>Grade Distribution</h4>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    {gradeOptions.slice(0, -1).map(grade => {
                      const count = courses.filter(c => c.grade === grade).length;
                      const percentage = courses.length > 0 ? (count / courses.length * 100) : 0;
                      
                      return (
                        <div key={grade} style={{ flex: 1 }}>
                          <div style={{ 
                            height: '100px', 
                            background: 'var(--gray-light)', 
                            borderRadius: '4px',
                            position: 'relative',
                            overflow: 'hidden'
                          }}>
                            <div style={{ 
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: `${percentage}%`,
                              background: 'var(--primary)',
                              transition: 'height 0.3s ease'
                            }}></div>
                          </div>
                          <div style={{ textAlign: 'center', marginTop: '5px' }}>
                            <div style={{ fontWeight: 'bold' }}>{grade}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{count}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MY PROFILE - Student Section */}
          {activeTab === 'profile' && currentUser?.role === 'student' && (
            <div className="card full-width">
              <div className="card-header">
                <h3>My Profile</h3>
                <button className="btn-primary">
                  <FaEdit /> Edit Profile
                </button>
              </div>
              <div className="card-body">
                <div className="profile-container" style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                  {/* Profile Info */}
                  <div className="profile-info" style={{ flex: 1, minWidth: '300px' }}>
                    <div className="profile-header" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '20px', 
                      marginBottom: '30px' 
                    }}>
                      <div className="profile-avatar" style={{ 
                        width: '100px', 
                        height: '100px', 
                        borderRadius: '50%', 
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '2.5rem',
                        fontWeight: 'bold'
                      }}>
                        {currentUser?.firstName[0]}{currentUser?.lastName[0]}
                      </div>
                      <div>
                        <h2 style={{ margin: 0 }}>{currentUser?.firstName} {currentUser?.lastName}</h2>
                        <p style={{ color: 'var(--gray)', margin: '5px 0' }}>{currentUser?.email}</p>
                        <span className={`badge student`}>
                          {currentUser?.role}
                        </span>
                      </div>
                    </div>

                    {/* Personal Information */}
                    <div className="info-section">
                      <h4><FaIdCard /> Personal Information</h4>
                      <div className="info-grid" style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: '15px', 
                        marginTop: '15px' 
                      }}>
                        <div className="info-item">
                          <label>Department</label>
                          <div className="info-value">{currentUser?.department || 'Computer Science'}</div>
                        </div>
                        <div className="info-item">
                          <label>Level</label>
                          <div className="info-value">{currentUser?.level || '200 Level'}</div>
                        </div>
                        <div className="info-item">
                          <label>Status</label>
                          <div className="info-value">
                            <span className={`status-badge ${currentUser?.status || 'active'}`}>
                              {currentUser?.status || 'active'}
                            </span>
                          </div>
                        </div>
                        <div className="info-item">
                          <label>Member Since</label>
                          <div className="info-value">
                            {currentUser?.createdAt 
                              ? new Date(currentUser.createdAt).toLocaleDateString() 
                              : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Academic Summary */}
                    <div className="info-section" style={{ marginTop: '30px' }}>
                      <h4><FaGraduationCap /> Academic Summary</h4>
                      <div className="academic-stats" style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                        gap: '15px', 
                        marginTop: '15px' 
                      }}>
                        <div className="academic-stat" style={{ 
                          padding: '15px', 
                          background: 'var(--gray-light)', 
                          borderRadius: '8px', 
                          textAlign: 'center' 
                        }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                            {studentStats.currentGPA}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>Cumulative GPA</div>
                        </div>
                        <div className="academic-stat" style={{ 
                          padding: '15px', 
                          background: 'var(--gray-light)', 
                          borderRadius: '8px', 
                          textAlign: 'center' 
                        }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                            {studentStats.totalCourses}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>Total Courses</div>
                        </div>
                        <div className="academic-stat" style={{ 
                          padding: '15px', 
                          background: 'var(--gray-light)', 
                          borderRadius: '8px', 
                          textAlign: 'center' 
                        }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                            {studentStats.totalCreditHours}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>Credit Hours</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="profile-activity" style={{ flex: 1, minWidth: '300px' }}>
                    <h4><FaHistory /> Recent Activity</h4>
                    <div className="activity-timeline" style={{ marginTop: '15px' }}>
                      {[
                        { action: 'Updated grade for Data Structures', time: '2 hours ago' },
                        { action: 'Added new course: Web Development', time: '1 day ago' },
                        { action: 'Updated profile information', time: '3 days ago' },
                        { action: 'Logged in to portal', time: '1 week ago' },
                      ].map((activity, index) => (
                        <div key={index} className="timeline-item" style={{ 
                          padding: '10px 0', 
                          borderBottom: '1px solid var(--gray-light)',
                          display: 'flex',
                          gap: '10px'
                        }}>
                          <div style={{ 
                            width: '8px', 
                            height: '8px', 
                            background: 'var(--primary)', 
                            borderRadius: '50%',
                            marginTop: '5px'
                          }}></div>
                          <div>
                            <div>{activity.action}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{activity.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Department</label>
                <input 
                  type="text"
                  value={editingUser.department}
                  onChange={(e) => setEditingUser({...editingUser, department: e.target.value})}
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