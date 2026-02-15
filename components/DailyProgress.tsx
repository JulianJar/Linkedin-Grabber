import React from 'react';
import { TrendingUp, CheckCircle } from 'lucide-react';

interface DailyProgressProps {
  count: number;
  target: number;
}

export const DailyProgress: React.FC<DailyProgressProps> = ({ count, target }) => {
  const percentage = Math.min((count / target) * 100, 100);
  const isGoalMet = count >= target;
  
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isGoalMet ? 'bg-green-100 text-green-600' : 'bg-linkedin-50 text-linkedin-600'}`}>
                {isGoalMet ? <CheckCircle className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            </div>
            <div>
                <h3 className="text-sm font-semibold text-gray-800">Daily Target</h3>
            </div>
        </div>
        <div className="text-right">
            <span className={`text-xl font-bold ${isGoalMet ? 'text-green-600' : 'text-gray-800'}`}>{count}</span>
            <span className="text-xs text-gray-400 font-medium"> / {target} leads</span>
        </div>
      </div>
      
      <div className="relative w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div 
            className={`h-full rounded-full transition-all duration-700 ease-out ${isGoalMet ? 'bg-green-500' : 'bg-linkedin-600'}`} 
            style={{ width: `${percentage}%` }}
        ></div>
      </div>
      
      {isGoalMet && (
          <p className="text-xs text-green-600 mt-2 font-medium text-center animate-in fade-in">
              🎉 Daily goal reached! Great job!
          </p>
      )}
    </div>
  );
};