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
  FaClock, FaStar, FaMoneyBillWave, FaLocationArrow,
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
  fees?: number;
  isFavorite: boolean;
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
  
  // Enhanced registration form
  const [formData, setFormData] = useState({
    firstName: '', 
    lastName: '', 
    email: '', 
    password: '',
    department: 'Computer Science',
    level: '100',
    studentId: '',
    phone: '',
    address: '',
    dob: '',
    gender: 'Male',
    registrationYear: new Date().getFullYear().toString(),
    graduationYear: (new Date().getFullYear() + 4).toString(),
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [placeholderAnim, setPlaceholderAnim] = useState(false);

  // Student dashboard states
  const [courses, setCourses] = useState<Course[]>([
    { 
      id: '1', 
      name: 'Data Structures and Algorithms', 
      code: 'CS201', 
      creditHours: 3, 
      grade: 'A', 
      semester: 'Fall', 
      year: '2024',
      instructor: 'Dr. Johnson',
      room: 'CSB-301',
      schedule: 'Mon/Wed 10:00-11:30 AM',
      description: 'Introduction to data structures and algorithm analysis',
      progress: 85,
      fees: 1500,
      isFavorite: true
    },
    { 
      id: '2', 
      name: 'Database Management Systems', 
      code: 'CS202', 
      creditHours: 3, 
      grade: 'B+', 
      semester: 'Fall', 
      year: '2024',
      instructor: 'Prof. Williams',
      room: 'CSB-205',
      schedule: 'Tue/Thu 2:00-3:30 PM',
      description: 'Fundamentals of database design and SQL',
      progress: 70,
      fees: 1500,
      isFavorite: false
    },
  ]);
  
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
    fees: 0
  });
  
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedCourseForGrade, setSelectedCourseForGrade] = useState<Course | null>(null);
  const [newGrade, setNewGrade] = useState('');
  const [semesters, setSemesters] = useState<string[]>(['Fall', 'Spring', 'Summer']);
  const [years, setYears] = useState<string[]>(['2024', '2025', '2026', '2027']);
  const [departments, setDepartments] = useState<string[]>([
    'Computer Science',
    'Information Technology',
    'Software Engineering',
    'Cybersecurity',
    'Data Science',
    'Computer Engineering',
    'Mathematics',
    'Physics'
  ]);
  const [levels, setLevels] = useState<string[]>(['100', '200', '300', '400', '500', 'Graduate']);

  // Profile editing states
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    level: '',
    studentId: '',
    phone: '',
    address: '',
    dob: '',
    gender: 'Male',
    registrationYear: '',
    graduationYear: '',
    advisor: '',
    cgpa: ''
  });

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
          // Initialize profile data
          if (res.data) {
            setProfileData({
              firstName: res.data.firstName || '',
              lastName: res.data.lastName || '',
              email: res.data.email || '',
              department: res.data.department || 'Computer Science',
              level: res.data.level || '100',
              studentId: res.data.studentId || '',
              phone: res.data.phone || '',
              address: res.data.address || '',
              dob: res.data.dob || '',
              gender: res.data.gender || 'Male',
              registrationYear: res.data.registrationYear || new Date().getFullYear().toString(),
              graduationYear: res.data.graduationYear || (new Date().getFullYear() + 4).toString(),
              advisor: res.data.advisor || '',
              cgpa: res.data.cgpa || ''
            });
          }
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
    totalFees: courses.reduce((sum, course) => sum + (course.fees || 0), 0),
    favoriteCourses: courses.filter(c => c.isFavorite).length,
    semesterGPA: (() => {
      const currentSemesterCourses = courses.filter(c => c.semester === 'Fall' && c.year === '2024');
      if (currentSemesterCourses.length === 0) return '0.00';
      
      const gradePoints: { [key: string]: number } = {
        'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0
      };
      
      let totalPoints = 0;
      let totalCredits = 0;
      
      currentSemesterCourses.forEach(course => {
        if (course.grade && gradePoints[course.grade.toUpperCase()] !== undefined && course.grade !== 'Not Graded') {
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
        
        // Initialize profile data from backend
        if (res.data.user) {
          setProfileData({
            firstName: res.data.user.firstName || '',
            lastName: res.data.user.lastName || '',
            email: res.data.user.email || '',
            department: res.data.user.department || 'Computer Science',
            level: res.data.user.level || '100',
            studentId: res.data.user.studentId || '',
            phone: res.data.user.phone || '',
            address: res.data.user.address || '',
            dob: res.data.user.dob || '',
            gender: res.data.user.gender || 'Male',
            registrationYear: res.data.user.registrationYear || new Date().getFullYear().toString(),
            graduationYear: res.data.user.graduationYear || (new Date().getFullYear() + 4).toString(),
            advisor: res.data.user.advisor || '',
            cgpa: res.data.user.cgpa || ''
          });
        }
        
        toast.success('🎉 Welcome back! Login successful');
      } else {
        console.log('Attempting registration with:', formData);
        // Include all student details in registration
        const registrationData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          department: formData.department,
          level: formData.level,
          studentId: formData.studentId,
          phone: formData.phone,
          address: formData.address,
          dob: formData.dob,
          gender: formData.gender,
          registrationYear: formData.registrationYear,
          graduationYear: formData.graduationYear,
          role: 'student',
          status: 'active'
        };
        
        const res = await API.post('/auth/register', registrationData);
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
      firstName: '', 
      lastName: '', 
      email: '', 
      password: '',
      department: 'Computer Science',
      level: '100',
      studentId: '',
      phone: '',
      address: '',
      dob: '',
      gender: 'Male',
      registrationYear: new Date().getFullYear().toString(),
      graduationYear: (new Date().getFullYear() + 4).toString(),
    });
    setImagePreview(null);
    setShowPassword(false);
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
      year: newCourse.year,
      instructor: newCourse.instructor,
      room: newCourse.room,
      schedule: newCourse.schedule,
      description: newCourse.description,
      progress: 0,
      fees: newCourse.fees,
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
      fees: 0
    });
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

  const toggleFavorite = (courseId: string) => {
    setCourses(courses.map(course => 
      course.id === courseId ? { ...course, isFavorite: !course.isFavorite } : course
    ));
  };

  const saveProfile = async () => {
    try {
      // Update profile in backend
      if (currentUser) {
        await API.put(`/users/${currentUser._id}`, profileData);
        toast.success('✅ Profile updated successfully');
        
        // Update current user state
        setCurrentUser({
          ...currentUser,
          ...profileData
        });
      }
      setEditingProfile(false);
    } catch (err: any) {
      console.error('Profile update error:', err);
      toast.error(`❌ ${err.response?.data?.message || 'Update failed'}`);
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
              <h1>{isLogin ? 'Welcome Back!' : 'Create Student Account'}</h1>
              <p>Computer Science Department Portal</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <>
                  {/* Personal Information */}
                  <div className="form-section">
                    <h3 style={{ marginBottom: '15px', color: 'var(--primary)' }}>
                      <FaUser /> Personal Information
                    </h3>
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
                    
                    <div className="form-row">
                      <div className="form-group">
                        <FaUserTag className="input-icon" />
                        <input 
                          type="text" 
                          placeholder="Student ID"
                          value={formData.studentId}
                          onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <FaCalendar className="input-icon" />
                        <input 
                          type="date" 
                          placeholder="Date of Birth"
                          value={formData.dob}
                          onChange={(e) => setFormData({...formData, dob: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({...formData, gender: e.target.value})}
                          style={{ width: '100%', padding: '12px 40px', borderRadius: '8px', border: '2px solid var(--gray-light)' }}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="form-section">
                    <h3 style={{ marginBottom: '15px', color: 'var(--primary)' }}>
                      <FaPhone /> Contact Information
                    </h3>
                    <div className="form-group">
                      <FaEnvelope className="input-icon" />
                      <input 
                        type="email" 
                        placeholder="University Email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <FaPhone className="input-icon" />
                      <input 
                        type="tel" 
                        placeholder="Phone Number"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <FaLocationArrow className="input-icon" />
                      <input 
                        type="text" 
                        placeholder="Address"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  {/* Academic Information */}
                  <div className="form-section">
                    <h3 style={{ marginBottom: '15px', color: 'var(--primary)' }}>
                      <FaSchool /> Academic Information
                    </h3>
                    <div className="form-row">
                      <div className="form-group">
                        <select
                          value={formData.department}
                          onChange={(e) => setFormData({...formData, department: e.target.value})}
                          style={{ width: '100%', padding: '12px 40px', borderRadius: '8px', border: '2px solid var(--gray-light)' }}
                        >
                          <option value="">Select Department</option>
                          {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <select
                          value={formData.level}
                          onChange={(e) => setFormData({...formData, level: e.target.value})}
                          style={{ width: '100%', padding: '12px 40px', borderRadius: '8px', border: '2px solid var(--gray-light)' }}
                        >
                          <option value="">Select Level</option>
                          {levels.map(level => (
                            <option key={level} value={level}>{level} Level</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <input 
                          type="number" 
                          placeholder="Registration Year"
                          value={formData.registrationYear}
                          onChange={(e) => setFormData({...formData, registrationYear: e.target.value})}
                          min="2000"
                          max="2030"
                          required
                          style={{ width: '100%', padding: '12px 20px', borderRadius: '8px', border: '2px solid var(--gray-light)' }}
                        />
                      </div>
                      <div className="form-group">
                        <input 
                          type="number" 
                          placeholder="Expected Graduation Year"
                          value={formData.graduationYear}
                          onChange={(e) => setFormData({...formData, graduationYear: e.target.value})}
                          min="2000"
                          max="2030"
                          required
                          style={{ width: '100%', padding: '12px 20px', borderRadius: '8px', border: '2px solid var(--gray-light)' }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {/* For login, only show email and password */}
              {isLogin ? (
                <>
                  <div className="form-group">
                    <FaEnvelope className="input-icon" />
                    <input 
                      type="email" 
                      placeholder={placeholderTexts.email}
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
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
              ) : (
                // Password section for registration
                <div className="form-section">
                  <h3 style={{ marginBottom: '15px', color: 'var(--primary)' }}>
                    <FaLock /> Account Security
                  </h3>
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
                </div>
              )}

              {!isLogin && (
                <>
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

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? (
                  <><FaSpinner className="spinner" /> Processing...</>
                ) : (
                  <>{isLogin ? <><FaSignOutAlt /> Sign In</> : <><FaUserPlus /> Create Student Account</>}</>
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
              {currentUser?.firstName?.[0] || 'S'}
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
                  <FaSchool /> {currentUser?.level} Level
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
                <FaBookOpen /> My Courses
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
                    <FaMoneyBillWave />
                  </div>
                  <div className="stat-info">
                    <h3>Course Fees</h3>
                    <div className="stat-number">${studentStats.totalFees}</div>
                    <div className="stat-change">Total this semester</div>
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
                        onClick={() => setActiveTab('profile')}
                      >
                        <FaEdit /> Update Profile
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
                    <h3>Academic Overview</h3>
                  </div>
                  <div className="card-body">
                    <div className="academic-overview">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>Department</div>
                          <div style={{ fontWeight: 'bold' }}>{currentUser?.department || 'Computer Science'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>Level</div>
                          <div style={{ fontWeight: 'bold' }}>{currentUser?.level || '100'} Level</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>Student ID</div>
                          <div style={{ fontWeight: 'bold' }}>{currentUser?.studentId || 'N/A'}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>Registration Year</div>
                          <div style={{ fontWeight: 'bold' }}>{currentUser?.registrationYear || 'N/A'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>Graduation Year</div>
                          <div style={{ fontWeight: 'bold' }}>{currentUser?.graduationYear || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* MY COURSES - Enhanced with full user input */}
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
                  padding: '25px', 
                  background: 'var(--gray-light)', 
                  borderRadius: '12px', 
                  marginBottom: '25px' 
                }}>
                  <h3 style={{ marginBottom: '20px', color: 'var(--primary)' }}>Add New Course</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    {/* Course Basic Info */}
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
                    
                    {/* Course Details */}
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
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Course Fees ($)</label>
                      <input 
                        type="number"
                        placeholder="e.g., 1500"
                        value={newCourse.fees}
                        onChange={(e) => setNewCourse({...newCourse, fees: parseInt(e.target.value) || 0})}
                        style={{ 
                          width: '100%', 
                          padding: '12px', 
                          border: '2px solid var(--gray)', 
                          borderRadius: '8px',
                          fontSize: '0.95rem'
                        }}
                      />
                    </div>
                    
                    {/* Semester & Year */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Semester</label>
                      <select
                        value={newCourse.semester}
                        onChange={(e) => setNewCourse({...newCourse, semester: e.target.value})}
                        style={{ 
                          width: '100%', 
                          padding: '12px', 
                          border: '2px solid var(--gray)', 
                          borderRadius: '8px',
                          fontSize: '0.95rem'
                        }}
                      >
                        {semesters.map(sem => (
                          <option key={sem} value={sem}>{sem}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Year</label>
                      <select
                        value={newCourse.year}
                        onChange={(e) => setNewCourse({...newCourse, year: e.target.value})}
                        style={{ 
                          width: '100%', 
                          padding: '12px', 
                          border: '2px solid var(--gray)', 
                          borderRadius: '8px',
                          fontSize: '0.95rem'
                        }}
                      >
                        {years.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Instructor & Room */}
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
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Room</label>
                      <input 
                        type="text"
                        placeholder="e.g., CSB-301"
                        value={newCourse.room}
                        onChange={(e) => setNewCourse({...newCourse, room: e.target.value})}
                        style={{ 
                          width: '100%', 
                          padding: '12px', 
                          border: '2px solid var(--gray)', 
                          borderRadius: '8px',
                          fontSize: '0.95rem'
                        }}
                      />
                    </div>
                    
                    {/* Schedule */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Schedule</label>
                      <input 
                        type="text"
                        placeholder="e.g., Mon/Wed 10:00-11:30 AM"
                        value={newCourse.schedule}
                        onChange={(e) => setNewCourse({...newCourse, schedule: e.target.value})}
                        style={{ 
                          width: '100%', 
                          padding: '12px', 
                          border: '2px solid var(--gray)', 
                          borderRadius: '8px',
                          fontSize: '0.95rem'
                        }}
                      />
                    </div>
                    
                    {/* Description */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Course Description</label>
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
                                <FaUserGraduate /> {course.instructor}
                              </div>
                              <div className="course-detail">
                                <FaCalendarAlt /> {course.semester} {course.year}
                              </div>
                              <div className="course-detail">
                                <FaLocationArrow /> {course.room}
                              </div>
                              <div className="course-detail">
                                <FaClock /> {course.schedule}
                              </div>
                              <div className="course-detail">
                                <FaPercent /> {course.creditHours} Credits
                              </div>
                              <div className="course-detail">
                                <FaTrophy /> Grade: {course.grade}
                              </div>
                              <div className="course-detail">
                                <FaMoneyBillWave /> ${course.fees}
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

          {/* MY GRADES */}
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
                  <table className="grades-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--gray-light)' }}>
                        <th style={{ padding: '15px', textAlign: 'left' }}>Course</th>
                        <th style={{ padding: '15px', textAlign: 'left' }}>Code</th>
                        <th style={{ padding: '15px', textAlign: 'left' }}>Credits</th>
                        <th style={{ padding: '15px', textAlign: 'left' }}>Semester</th>
                        <th style={{ padding: '15px', textAlign: 'left' }}>Current Grade</th>
                        <th style={{ padding: '15px', textAlign: 'left' }}>Grade Points</th>
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
                            <td style={{ padding: '15px' }}>{course.semester} {course.year}</td>
                            <td style={{ padding: '15px' }}>
                              <span className={`grade-badge ${course.grade}`}>
                                {course.grade}
                              </span>
                            </td>
                            <td style={{ padding: '15px' }}>{(points * course.creditHours).toFixed(1)}</td>
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
                </div>

                {/* Grade Distribution Chart */}
                <div className="grade-distribution" style={{ marginTop: '40px', padding: '20px', background: 'var(--gray-light)', borderRadius: '10px' }}>
                  <h4 style={{ marginBottom: '20px' }}>Grade Distribution</h4>
                  <div style={{ display: 'flex', gap: '15px', marginTop: '10px', alignItems: 'flex-end', height: '150px' }}>
                    {gradeOptions.slice(0, -1).map(grade => {
                      const count = courses.filter(c => c.grade === grade).length;
                      const percentage = courses.length > 0 ? (count / courses.length * 100) : 0;
                      const height = Math.max(30, percentage * 1.2); // Minimum height of 30px
                      
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
              </div>
            </div>
          )}

          {/* MY PROFILE - Enhanced with editable fields */}
          {activeTab === 'profile' && currentUser?.role === 'student' && (
            <div className="card full-width">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>My Profile</h3>
                <div>
                  {!editingProfile ? (
                    <button 
                      className="btn-primary"
                      onClick={() => setEditingProfile(true)}
                    >
                      <FaEdit /> Edit Profile
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        className="btn-primary"
                        onClick={saveProfile}
                      >
                        <FaCheckCircle /> Save Changes
                      </button>
                      <button 
                        className="btn-secondary"
                        onClick={() => setEditingProfile(false)}
                      >
                        <FaTimes /> Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="card-body">
                <div className="profile-container" style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                  {/* Profile Info */}
                  <div className="profile-info" style={{ flex: 1, minWidth: '350px' }}>
                    <div className="profile-header" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '25px', 
                      marginBottom: '30px',
                      paddingBottom: '20px',
                      borderBottom: '2px solid var(--gray-light)'
                    }}>
                      <div className="profile-avatar" style={{ 
                        width: '120px', 
                        height: '120px', 
                        borderRadius: '50%', 
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '3rem',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                      }}>
                        {currentUser?.firstName?.[0] || 'S'}{currentUser?.lastName?.[0] || 'T'}
                      </div>
                      <div style={{ flex: 1 }}>
                        {editingProfile ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <input 
                                type="text"
                                placeholder="First Name"
                                value={profileData.firstName}
                                onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                                style={{ 
                                  flex: 1, 
                                  padding: '10px', 
                                  border: '2px solid var(--gray-light)', 
                                  borderRadius: '6px',
                                  fontSize: '1.1rem'
                                }}
                              />
                              <input 
                                type="text"
                                placeholder="Last Name"
                                value={profileData.lastName}
                                onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                                style={{ 
                                  flex: 1, 
                                  padding: '10px', 
                                  border: '2px solid var(--gray-light)', 
                                  borderRadius: '6px',
                                  fontSize: '1.1rem'
                                }}
                              />
                            </div>
                            <input 
                              type="email"
                              placeholder="Email"
                              value={profileData.email}
                              onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                              style={{ 
                                padding: '10px', 
                                border: '2px solid var(--gray-light)', 
                                borderRadius: '6px'
                              }}
                            />
                          </div>
                        ) : (
                          <>
                            <h2 style={{ margin: 0, fontSize: '1.8rem' }}>{currentUser?.firstName} {currentUser?.lastName}</h2>
                            <p style={{ color: 'var(--gray)', margin: '5px 0', fontSize: '1.1rem' }}>{currentUser?.email}</p>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                              <span className={`badge student`} style={{ fontSize: '0.9rem' }}>
                                {currentUser?.role}
                              </span>
                              <span className={`status-badge ${currentUser?.status || 'active'}`}>
                                {currentUser?.status || 'active'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Personal Information */}
                    <div className="info-section" style={{ marginBottom: '30px' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <FaIdCard /> Personal Information
                      </h4>
                      <div className="info-grid" style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                        gap: '20px' 
                      }}>
                        {editingProfile ? (
                          <>
                            <div className="info-item">
                              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '0.9rem' }}>Student ID</label>
                              <input 
                                type="text"
                                value={profileData.studentId}
                                onChange={(e) => setProfileData({...profileData, studentId: e.target.value})}
                                style={{ 
                                  width: '100%', 
                                  padding: '10px', 
                                  border: '2px solid var(--gray-light)', 
                                  borderRadius: '6px'
                                }}
                              />
                            </div>
                            <div className="info-item">
                              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '0.9rem' }}>Date of Birth</label>
                              <input 
                                type="date"
                                value={profileData.dob}
                                onChange={(e) => setProfileData({...profileData, dob: e.target.value})}
                                style={{ 
                                  width: '100%', 
                                  padding: '10px', 
                                  border: '2px solid var(--gray-light)', 
                                  borderRadius: '6px'
                                }}
                              />
                            </div>
                            <div className="info-item">
                              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '0.9rem' }}>Gender</label>
                              <select
                                value={profileData.gender}
                                onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
                                style={{ 
                                  width: '100%', 
                                  padding: '10px', 
                                  border: '2px solid var(--gray-light)', 
                                  borderRadius: '6px'
                                }}
                              >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            <div className="info-item">
                              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '0.9rem' }}>Phone</label>
                              <input 
                                type="tel"
                                value={profileData.phone}
                                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                                style={{ 
                                  width: '100%', 
                                  padding: '10px', 
                                  border: '2px solid var(--gray-light)', 
                                  borderRadius: '6px'
                                }}
                              />
                            </div>
                            <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '0.9rem' }}>Address</label>
                              <textarea
                                value={profileData.address}
                                onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                                rows={2}
                                style={{ 
                                  width: '100%', 
                                  padding: '10px', 
                                  border: '2px solid var(--gray-light)', 
                                  borderRadius: '6px',
                                  resize: 'vertical'
                                }}
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="info-item">
                              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '0.9rem' }}>Student ID</label>
                              <div className="info-value" style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                                {currentUser?.studentId || 'Not Provided'}
                              </div>
                            </div>
                            <div className="info-item">
                              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '0.9rem' }}>Date of Birth</label>
                              <div className="info-value" style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                                {currentUser?.dob ? new Date(currentUser.dob).toLocaleDateString() : 'Not Provided'}
                              </div>
                            </div>
                            <div className="info-item">
                              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '0.9rem' }}>Gender</label>
                              <div className="info-value" style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                                {currentUser?.gender || 'Not Provided'}
                              </div>
                            </div>
                            <div className="info-item">
                              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '0.9rem' }}>Phone</label>
                              <div className="info-value" style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                                {currentUser?.phone || 'Not Provided'}
                              </div>
                            </div>
                            <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '0.9rem' }}>Address</label>
                              <div className="info-value" style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                                {currentUser?.address || 'Not Provided'}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Academic Information */}
                    <div className="info-section">
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <FaGraduationCap /> Academic Information
                      </h4>
                      <div className="info-grid" style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                        gap: '20px' 
                      }}>
                        {editingProfile ? (
                          <>
                            <div className="info-item">
                              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '0.9rem' }}>Department</label>
                              <select
                                value={profileData.department}
                                onChange={(e) => setProfileData({...profileData, department: e.target.value})}
                                style={{ 
                                  width: '100%', 
                                  padding: '10px', 
                                  border: '2px solid var(--gray-light)', 
                                  borderRadius: '6px'
                                }}
                              >
                                {departments.map(dept => (
                                  <option key={dept} value={dept}>{dept}</option>
                                ))}
                              </select>
                            </div>
                            <div className="info-item">
                              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '0.9rem' }}>Level</label>
                              <select
                                value={profileData.level}
                                onChange={(e) => setProfileData({...profileData, level: e.target.value})}
                                style={{ 
                                  width: '100%', 
                                  padding: '10px', 
                                  border: '2px solid var(--gray-light)', 
                                  borderRadius: '6px'
                                }}
                              >
                                {levels.map(level => (
                                  <option key={level} value={level}>{level} Level</option>
                                ))}
                              </select>
                            </div>
                            <div className="info-item">
                              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '0.9rem' }}>Registration Year</label>
                              <input 
                                type="number"
                                value={profileData.registrationYear}
                                onChange={(e) => setProfileData({...profileData, registrationYear: e.target.value})}
                                min="2000"
                                max="2030"
                                style={{ 
                                  width: '100%', 
                                  padding: '10px', 
                                  border: '2px solid var(--gray-light)', 
                                  borderRadius: '6px'
                                }}
                              />
                            </div>
                            <div className="info-item">
                              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '0.9rem' }}>Graduation Year</label>
                              <input 
                                type="number"
                                value={profileData.graduationYear}
                                onChange={(e) => setProfileData({...profileData, graduationYear: e.target.value})}
                                min="2000"
                                max="2030"
                                style={{ 
                                  width: '100%', 
                                  padding: '10px', 
                                  border: '2px solid var(--gray-light)', 
                                  borderRadius: '6px'
                                }}
                              />
                            </div>
                            <div className="info-item">
                              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '0.9rem' }}>Academic Advisor</label>
                              <input 
                                type="text"
                                value={profileData.advisor}
                                onChange={(e) => setProfileData({...profileData, advisor: e.target.value})}
                                style={{ 
                                  width: '100%', 
                                  padding: '10px', 
                                  border: '2px solid var(--gray-light)', 
                                  borderRadius: '6px'
                                }}
                              />
                            </div>
                            <div className="info-item">
                              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '0.9rem' }}>Current CGPA</label>
                              <input 
                                type="number"
                                step="0.01"
                                min="0"
                                max="4.0"
                                value={profileData.cgpa}
                                onChange={(e) => setProfileData({...profileData, cgpa: e.target.value})}
                                style={{ 
                                  width: '100%', 
                                  padding: '10px', 
                                  border: '2px solid var(--gray-light)', 
                                  borderRadius: '6px'
                                }}
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="info-item">
                              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '0.9rem' }}>Department</label>
                              <div className="info-value" style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                                {currentUser?.department || 'Not Provided'}
                              </div>
                            </div>
                            <div className="info-item">
                              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '0.9rem' }}>Level</label>
                              <div className="info-value" style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                                {currentUser?.level || 'Not Provided'} Level
                              </div>
                            </div>
                            <div className="info-item">
                              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '0.9rem' }}>Registration Year</label>
                              <div className="info-value" style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                                {currentUser?.registrationYear || 'Not Provided'}
                              </div>
                            </div>
                            <div className="info-item">
                              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '0.9rem' }}>Graduation Year</label>
                              <div className="info-value" style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                                {currentUser?.graduationYear || 'Not Provided'}
                              </div>
                            </div>
                            <div className="info-item">
                              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '0.9rem' }}>Academic Advisor</label>
                              <div className="info-value" style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                                {currentUser?.advisor || 'Not Assigned'}
                              </div>
                            </div>
                            <div className="info-item">
                              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '0.9rem' }}>Current CGPA</label>
                              <div className="info-value" style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                                {currentUser?.cgpa || studentStats.currentGPA}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Academic Summary & Recent Activity */}
                  <div className="profile-sidebar" style={{ flex: 1, minWidth: '300px' }}>
                    {/* Academic Summary */}
                    <div className="academic-stats" style={{ 
                      background: 'linear-gradient(135deg, var(--primary), var(--secondary))', 
                      padding: '25px', 
                      borderRadius: '12px', 
                      color: 'white',
                      marginBottom: '25px'
                    }}>
                      <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaCalculator /> Academic Summary
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                        <div className="academic-stat">
                          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                            {studentStats.currentGPA}
                          </div>
                          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Cumulative GPA</div>
                        </div>
                        <div className="academic-stat">
                          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                            {studentStats.totalCourses}
                          </div>
                          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Courses</div>
                        </div>
                        <div className="academic-stat">
                          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                            {studentStats.totalCreditHours}
                          </div>
                          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Credit Hours</div>
                        </div>
                        <div className="academic-stat">
                          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                            {studentStats.completedCourses}
                          </div>
                          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Completed</div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="profile-activity">
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <FaHistory /> Recent Activity
                      </h4>
                      <div className="activity-timeline" style={{ marginTop: '15px' }}>
                        {[
                          { action: 'Updated grade for Data Structures', time: '2 hours ago', icon: <FaTrophy /> },
                          { action: 'Added new course: Web Development', time: '1 day ago', icon: <FaBookOpen /> },
                          { action: 'Updated profile information', time: '3 days ago', icon: <FaEdit /> },
                          { action: 'Logged in to portal', time: '1 week ago', icon: <FaSignOutAlt /> },
                          { action: 'Registered for semester', time: '2 weeks ago', icon: <FaCalendar /> },
                        ].map((activity, index) => (
                          <div key={index} className="timeline-item" style={{ 
                            padding: '12px 0', 
                            borderBottom: '1px solid var(--gray-light)',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'flex-start'
                          }}>
                            <div style={{ 
                              width: '32px', 
                              height: '32px', 
                              background: 'var(--primary)', 
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '0.9rem'
                            }}>
                              {activity.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ marginBottom: '3px' }}>{activity.action}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{activity.time}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ADMIN SECTIONS (Keep existing) */}
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