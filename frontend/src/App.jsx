import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CustomerDashboard from './pages/CustomerDashboard';

// Pharmacy Pages
import PharmacyDashboard from './pages/PharmacyDashboard/Overview';
import PharmacyInventory from './pages/PharmacyDashboard/Inventory';
import PharmacyRequests from './pages/PharmacyDashboard/Requests';
import PharmacyProfile from './pages/PharmacyDashboard/Profile';

// Admin Pages
import AdminOverview from './pages/Admin/Overview';
import AdminUsers from './pages/Admin/UserManagement';
import AdminPharmacies from './pages/Admin/PharmacyManagement';
import AdminPrescriptions from './pages/Admin/PrescriptionLogs';
import AdminDataset from './pages/Admin/DatasetManager';
import AdminAnalytics from './pages/Admin/Analytics';

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<CustomerDashboard />} />

            {/* Pharmacy Owner Routes */}
            <Route path="/pharmacy/dashboard" element={<PharmacyDashboard />} />
            <Route path="/pharmacy/inventory" element={<PharmacyInventory />} />
            <Route path="/pharmacy/requests" element={<PharmacyRequests />} />
            <Route path="/pharmacy/profile" element={<PharmacyProfile />} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<AdminOverview />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/pharmacies" element={<AdminPharmacies />} />
            <Route path="/admin/prescriptions" element={<AdminPrescriptions />} />
            <Route path="/admin/dataset" element={<AdminDataset />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
