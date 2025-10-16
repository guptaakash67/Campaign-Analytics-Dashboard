'use client';

import { useState, useEffect } from 'react';

interface Campaign {
  id: number;
  campaign_name: string;
  status: 'Active' | 'Paused';
  clicks: number;
  cost: number;
  impressions: number;
}

export default function CampaignDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  // Modal state for creating a campaign
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStatus, setNewStatus] = useState<'Active'|'Paused'>('Active');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const url = `${API_URL}/campaigns`;
      console.log('Fetching campaigns from:', url, 'NEXT_PUBLIC_API_URL=', process.env.NEXT_PUBLIC_API_URL);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }
      
      const data = await response.json();
      setCampaigns(data);
      setFilteredCampaigns(data);
      setError('');
    } catch (err) {
      setError('Unable to load campaigns. Please try again later.');
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async (payload: {campaign_name: string, status: string, clicks?: number, cost?: number, impressions?: number}) => {
    try {
      const url = `${API_URL}/campaigns`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Create failed', res.status, text);
        throw new Error(text || String(res.status));
      }

      await fetchCampaigns();
    } catch (err) {
      console.error('Error creating campaign:', err);
      throw err;
    }
  };

  const handleSubmitNew = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      await createCampaign({ campaign_name: newName, status: newStatus, clicks: 0, cost: 0.0, impressions: 0 });
      setNewName('');
      setNewStatus('Active');
      setShowModal(false);
    } catch (err) {
      alert('Failed to create campaign. See console for details.');
    }
  };

  useEffect(() => {
    if (statusFilter === 'All') {
      setFilteredCampaigns(campaigns);
    } else {
      const filtered = campaigns.filter(
        (campaign) => campaign.status === statusFilter
      );
      setFilteredCampaigns(filtered);
    }
    setCurrentPage(1);
  }, [statusFilter, campaigns]);

  // Calculate metrics
  const totalCampaigns = filteredCampaigns.length;
  const activeCampaigns = filteredCampaigns.filter(c => c.status === 'Active').length;
  const totalClicks = filteredCampaigns.reduce((sum, c) => sum + c.clicks, 0);
  const totalCost = filteredCampaigns.reduce((sum, c) => sum + c.cost, 0);
  const totalImpressions = filteredCampaigns.reduce((sum, c) => sum + c.impressions, 0);
  const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  // Pagination
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentCampaigns = filteredCampaigns.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredCampaigns.length / rowsPerPage);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const calculateCTR = (clicks: number, impressions: number) => {
    if (impressions === 0) return '0.00%';
    return ((clicks / impressions) * 100).toFixed(2) + '%';
  };

  const calculateCPC = (cost: number, clicks: number) => {
    if (clicks === 0) return '$0.00';
    return formatCurrency(cost / clicks);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-indigo-600 mb-2">
                Campaign Dashboard
              </h1>
              <p className="text-gray-600">
                Manage and monitor your advertising campaigns
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchCampaigns}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-lg shadow-indigo-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Campaign
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-600 font-medium">Total Campaigns</p>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{totalCampaigns}</p>
              <p className="text-sm text-green-600 font-medium">{activeCampaigns} active</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-600 font-medium">Total Clicks</p>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(totalClicks)}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-600 font-medium">Total Cost</p>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalCost)}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-600 font-medium">Average CTR</p>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{averageCTR.toFixed(2)}%</p>
            </div>
          </div>
        )}

        {/* Main Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">All Campaigns</h2>
          </div>

          {loading && (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading campaigns...</p>
            </div>
          )}

          {error && !loading && (
            <div className="p-6 m-6 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Campaign Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Clicks
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Impressions
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        CTR
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Cost
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        CPC
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentCampaigns.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          No campaigns found
                        </td>
                      </tr>
                    ) : (
                      currentCampaigns.map((campaign) => (
                        <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{campaign.campaign_name}</div>
                            <div className="text-sm text-gray-500">ID: {campaign.id}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${
                                campaign.status === 'Active'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                campaign.status === 'Active' ? 'bg-green-500' : 'bg-yellow-500'
                              }`}></span>
                              {campaign.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-gray-900">
                            {formatNumber(campaign.clicks)}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-900">
                            {formatNumber(campaign.impressions)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-blue-600 font-medium">
                              {calculateCTR(campaign.clicks, campaign.impressions)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-gray-900">
                            {formatCurrency(campaign.cost)}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-900">
                            {calculateCPC(campaign.cost, campaign.clicks)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Rows per page:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                  <span className="text-sm text-gray-600 ml-4">
                    {indexOfFirstRow + 1}-{Math.min(indexOfLastRow, filteredCampaigns.length)} of {filteredCampaigns.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Campaign Modal (simple) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Create Campaign</h3>
            <form onSubmit={handleSubmitNew}>
              <label className="block mb-2 text-sm font-medium text-gray-700">Name</label>
              <input required value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 mb-3" />

              <label className="block mb-2 text-sm font-medium text-gray-700">Status</label>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as 'Active'|'Paused')} className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4">
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
              </select>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-md bg-gray-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 text-white">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}