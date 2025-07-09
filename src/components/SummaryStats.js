import React from 'react';
import { 
  Home, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  PauseCircle 
} from 'lucide-react';

const SummaryStats = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Properties',
      value: stats.totalProperties,
      icon: Home,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Closed Sales',
      value: stats.closedProperties,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Active Listings',
      value: stats.activeProperties,
      icon: AlertCircle,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Pending Sales',
      value: stats.pendingProperties,
      icon: PauseCircle,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    }
  ];

  const metricCards = [
    {
      title: 'Avg List Price',
      value: `$${parseInt(stats.avgListPrice).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    },
    {
      title: 'Avg Close Price',
      value: `$${parseInt(stats.avgClosePrice).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    },
    {
      title: 'Avg Price/SqFt',
      value: `$${parseInt(stats.avgPricePerSqFt)}`,
      icon: TrendingUp,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    },
    {
      title: 'Avg Days on Market',
      value: `${stats.avgDaysOnMarket} days`,
      icon: Clock,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Property Status Overview */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Status Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, index) => (
            <div key={index} className="card">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`w-6 h-6 ${card.textColor}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map((card, index) => (
            <div key={index} className="card">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`w-6 h-6 ${card.textColor}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Insights */}
      {stats.avgPriceDifference && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Insights</h3>
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Average Price Difference</h4>
                <div className="flex items-center">
                  <span className={`text-2xl font-bold ${
                    parseFloat(stats.avgPriceDifference) > 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {parseFloat(stats.avgPriceDifference) > 0 ? '+' : ''}
                    ${parseInt(Math.abs(stats.avgPriceDifference)).toLocaleString()}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">
                    (Close vs List)
                  </span>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Market Performance</h4>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    parseFloat(stats.avgPriceDifference) > 0 
                      ? 'bg-green-500' 
                      : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm text-gray-700">
                    {parseFloat(stats.avgPriceDifference) > 0 
                      ? 'Properties selling above list price' 
                      : 'Properties selling below list price'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryStats; 