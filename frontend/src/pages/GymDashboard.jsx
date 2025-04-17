import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';

const GymDashboard = () => {
    const { user, userDetails } = useContext(AuthContext);
    const [joinRequests, setJoinRequests] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [joinRequestsLoading, setJoinRequestsLoading] = useState(true);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [joinRequestsError, setJoinRequestsError] = useState('');
    const [reviewsError, setReviewsError] = useState('');

    useEffect(() => {
        // Log userDetails._id to debug the malformed gymId
        console.log('userDetails._id:', userDetails?._id);

        const fetchJoinRequests = async () => {
            try {
                setJoinRequestsLoading(true);
                // Validate userDetails._id
                if (!userDetails?._id || typeof userDetails._id !== 'string' || !/^[0-9a-fA-F]{24}$/.test(userDetails._id)) {
                    throw new Error('Invalid gym ID in user details');
                }

                const token = localStorage.getItem('token');
                const res = await axios.get(`http://localhost:5000/api/gym/requests/${userDetails._id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setJoinRequests(res.data);
            } catch (err) {
                console.error('Error fetching join requests:', err);
                setJoinRequestsError(err.response?.data?.message || 'Failed to fetch join requests');
                toast.error(err.response?.data?.message || 'Failed to fetch join requests');
            } finally {
                setJoinRequestsLoading(false);
            }
        };

        const fetchReviews = async () => {
            try {
                setReviewsLoading(true);
                // Validate userDetails._id
                if (!userDetails?._id || typeof userDetails._id !== 'string' || !/^[0-9a-fA-F]{24}$/.test(userDetails._id)) {
                    throw new Error('Invalid gym ID in user details');
                }

                const res = await axios.get(`http://localhost:5000/api/review/gym/${userDetails._id}`);
                setReviews(res.data);
            } catch (err) {
                console.error('Error fetching reviews:', err);
                setReviewsError(err.response?.data?.message || 'Failed to fetch reviews');
                toast.error(err.response?.data?.message || 'Failed to fetch reviews');
            } finally {
                setReviewsLoading(false);
            }
        };

        if (user?.role === 'gym' && userDetails) {
            fetchJoinRequests();
            fetchReviews();
        } else {
            setJoinRequestsLoading(false);
            setReviewsLoading(false);
            setJoinRequestsError('User details not available');
            setReviewsError('User details not available');
        }
    }, [user, userDetails]);

    const handleRequestAction = async (requestId, action) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:5000/api/gym/request/${requestId}`,
                { action },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setJoinRequests(joinRequests.filter((req) => req._id !== requestId));
            toast.success(`Request ${action}ed successfully`);
        } catch (err) {
            toast.error(err.response?.data?.message || `Failed to ${action} request`);
        }
    };

    if (user?.role !== 'gym') {
        return <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <p className="text-red-500">Access denied. This page is only for Gyms.</p>
        </div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 py-6 sm:py-8 px-4">
            <div className="container mx-auto">
                <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center">Gym Dashboard</h1>
                
                {/* Join Requests Section */}
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg mb-6 sm:mb-8">
                    <h2 className="text-lg sm:text-xl font-bold mb-4">Join Requests</h2>
                    {joinRequestsError && <p className="text-red-500 mb-4 text-center">{joinRequestsError}</p>}
                    {joinRequestsLoading ? (
                        <div className="flex justify-center">
                            <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    ) : joinRequests.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr>
                                        <th className="p-2 text-sm sm:text-base">User</th>
                                        <th className="p-2 text-sm sm:text-base hidden sm:table-cell">Role</th>
                                        <th className="p-2 text-sm sm:text-base hidden md:table-cell">Status</th>
                                        <th className="p-2 text-sm sm:text-base">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {joinRequests.map((request) => (
                                        <tr key={request._id} className="border-t">
                                            <td className="p-2 text-sm sm:text-base">{request.user.name} ({request.user.email})</td>
                                            <td className="p-2 text-sm sm:text-base hidden sm:table-cell">{request.role}</td>
                                            <td className="p-2 text-sm sm:text-base hidden md:table-cell">{request.status}</td>
                                            <td className="p-2 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                                {request.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleRequestAction(request._id, 'approve')}
                                                            className="bg-green-600 text-white px-2 sm:px-3 py-1 rounded hover:bg-green-700 text-xs sm:text-sm"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleRequestAction(request._id, 'reject')}
                                                            className="bg-red-600 text-white px-2 sm:px-3 py-1 rounded hover:bg-red-700 text-xs sm:text-sm"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-700 text-center">No join requests</p>
                    )}
                </div>

                {/* Reviews Section */}
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
                    <h2 className="text-lg sm:text-xl font-bold mb-4">Gym Reviews</h2>
                    {reviewsError && <p className="text-red-500 mb-4 text-center">{reviewsError}</p>}
                    {reviewsLoading ? (
                        <div className="flex justify-center">
                            <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    ) : reviews.length > 0 ? (
                        <div className="space-y-4">
                            {reviews.map((review) => (
                                <div key={review._id} className="border-b pb-4">
                                    <p className="text-sm sm:text-base text-gray-700">
                                        <strong>{review.member.name}</strong> rated {review.rating} stars - {new Date(review.createdAt).toLocaleDateString()}
                                    </p>
                                    <p className="text-gray-600 text-sm sm:text-base">{review.comment}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-700 text-center">No reviews yet</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GymDashboard;