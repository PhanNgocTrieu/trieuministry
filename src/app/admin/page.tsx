export default function AdminDashboardPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Stats Cards */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">Total Users</h3>
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                            <i className="fas fa-users"></i>
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">--</p>
                    <p className="text-green-500 text-sm mt-2 font-medium flex items-center gap-1">
                        <i className="fas fa-arrow-up"></i> 12% increase
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">Prayers</h3>
                        <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                            <i className="fas fa-praying-hands"></i>
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">--</p>
                    <p className="text-gray-400 text-sm mt-2 font-medium">pending Review</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">Blogs</h3>
                        <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                            <i className="fas fa-blog"></i>
                        </div>
                    </div>
                     <p className="text-3xl font-bold text-gray-900">--</p>
                </div>
                
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">Visits</h3>
                        <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                            <i className="fas fa-chart-line"></i>
                        </div>
                    </div>
                     <p className="text-3xl font-bold text-gray-900">--</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
                <div className="text-center text-gray-500 py-8">
                    Activity log coming soon...
                </div>
            </div>
        </div>
    );
}
