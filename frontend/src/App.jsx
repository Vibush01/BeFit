import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import GymManagement from './pages/GymManagement';
import MembershipManagement from './pages/MembershipManagement';
import TrainerPlanManagement from './pages/TrainerPlanManagement';
import MemberPlans from './pages/MemberPlans';
import JoinGym from './pages/JoinGym';
import ApplyGym from './pages/ApplyGym';
import ManageRequests from './pages/ManageRequests';
import Notifications from './pages/Notifications';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/gym-management" element={<GymManagement />} />
            <Route path="/membership-management" element={<MembershipManagement />} />
            <Route path="/trainer-plan-management" element={<TrainerPlanManagement />} />
            <Route path="/member-plans" element={<MemberPlans />} />
            <Route path="/join-gym" element={<JoinGym />} />
            <Route path="/apply-gym" element={<ApplyGym />} />
            <Route path="/manage-requests" element={<ManageRequests />} />
            <Route path="/notifications" element={<Notifications />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;