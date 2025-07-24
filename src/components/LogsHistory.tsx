import React, { createElement } from 'react';
import { Clock, Download } from 'lucide-react';
interface LogsHistoryProps {
  isConnected: boolean;
  logs: Array<{
    time: string;
    heartRate: number;
    airQuality: number;
    usage: number;
  }>;
}
export const LogsHistory = ({
  isConnected,
  logs
}: LogsHistoryProps) => {
  // Function to download logs as CSV
  const downloadCSV = () => {
    // Create CSV content
    const headers = ['Time', 'Heart Rate (BPM)', 'Air Quality (%)', 'Inhaler Usage'];
    const csvContent = [headers.join(','), ...logs.map(log => `${log.time},${log.heartRate},${log.airQuality},${log.usage}`)].join('\n');
    // Create a blob and download link
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    // Set up download
    link.setAttribute('href', url);
    link.setAttribute('download', `respiraMate_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Data Logs / History
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center text-sm text-gray-500">
            <Clock size={16} className="mr-1" />
            <span>Real-time updates</span>
          </div>
          {isConnected && logs.length > 0 && <button onClick={downloadCSV} className="flex items-center text-sm text-blue-600 hover:text-blue-800">
              <Download size={16} className="mr-1" />
              Export CSV
            </button>}
        </div>
      </div>
      {isConnected ? logs.length > 0 ? <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Heart Rate
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Air Quality
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inhaler Usage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log, index) => <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {Math.round(log.heartRate)} BPM
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {Math.round(log.airQuality)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.usage}
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div> : <div className="text-center py-8 text-gray-500">
            <p>Collecting data... Logs will appear shortly</p>
          </div> : <div className="text-center py-8 text-gray-500">
          <p>Connect your device to view historical data</p>
        </div>}
    </div>;
};