import { useState, useEffect } from 'react';
import { checkHealth, getRecommendations, type RecommendRequest, type RecommendResponse } from './api';
import { Activity, Server, Target, AlertCircle, CheckCircle2, Bot } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | undefined | null | false)[]) => {
  return twMerge(clsx(inputs));
};

const HIGH_ACTIVITY_PROFILE: RecommendRequest = {
  user_id: "USR-1001",
  interaction_count: 500.0,
  average_rating: 4.5,
  rating_std: 0.5,
  activity_span_days: 300.0,
  recency_days: 2.0,
  active_days: 100.0,
  interactions_per_active_day: 5.0,
  weekend_interaction_ratio: 0.3,
  unique_genre_count: 15,
  genre_prop_action: 0.0,
  genre_prop_adventure: 0.0,
  genre_prop_animation: 0.0,
  genre_prop_childrens: 0.0,
  genre_prop_comedy: 0.5,
  genre_prop_crime: 0.0,
  genre_prop_documentary: 0.0,
  genre_prop_drama: 0.5,
  genre_prop_fantasy: 0.0,
  genre_prop_film_noir: 0.0,
  genre_prop_horror: 0.0,
  genre_prop_musical: 0.0,
  genre_prop_mystery: 0.0,
  genre_prop_romance: 0.0,
  genre_prop_sci_fi: 0.0,
  genre_prop_thriller: 0.0,
  genre_prop_war: 0.0,
  genre_prop_western: 0.0
};

const CASUAL_PROFILE: RecommendRequest = {
  user_id: "USR-1002",
  interaction_count: 25.0,
  average_rating: 3.0,
  rating_std: 1.2,
  activity_span_days: 10.0,
  recency_days: 50.0,
  active_days: 5.0,
  interactions_per_active_day: 5.0,
  weekend_interaction_ratio: 0.8,
  unique_genre_count: 2,
  genre_prop_action: 0.8,
  genre_prop_adventure: 0.0,
  genre_prop_animation: 0.0,
  genre_prop_childrens: 0.0,
  genre_prop_comedy: 0.2,
  genre_prop_crime: 0.0,
  genre_prop_documentary: 0.0,
  genre_prop_drama: 0.0,
  genre_prop_fantasy: 0.0,
  genre_prop_film_noir: 0.0,
  genre_prop_horror: 0.0,
  genre_prop_musical: 0.0,
  genre_prop_mystery: 0.0,
  genre_prop_romance: 0.0,
  genre_prop_sci_fi: 0.0,
  genre_prop_thriller: 0.0,
  genre_prop_war: 0.0,
  genre_prop_western: 0.0
};

export default function App() {
  const [health, setHealth] = useState<{ status: string, model_loaded: boolean } | null>(null);
  const [healthError, setHealthError] = useState<string>('');
  
  const [formData, setFormData] = useState<RecommendRequest>(HIGH_ACTIVITY_PROFILE);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecommendResponse | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    checkHealth()
      .then(res => setHealth(res))
      .catch(_err => {
        setHealthError('API Unavailable');
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'user_id' ? value : Number(value)
    }));
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await getRecommendations(formData);
      setResult(res);
    } catch (err: any) {
      if (err.response?.status === 422) {
        setError('Validation Error: Please check the input fields.');
      } else if (err.response?.status === 503) {
        setError('Model Unavailable: The API is up, but the ML model is not loaded.');
      } else {
        setError('Failed to reach API. Make sure the backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (preset: RecommendRequest) => {
    setFormData(preset);
  };

  const NUMERIC_FIELDS = Object.keys(CASUAL_PROFILE).filter(k => k !== 'user_id');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Activity className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">OTT Audience Intelligence</h1>
              <p className="text-slate-400 font-medium">Behavioral Segmentation & Personalization</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 px-6 py-3 bg-slate-900 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-slate-400" />
              <span className="font-medium text-sm">API:</span>
              {healthError ? (
                <span className="flex items-center text-red-400 text-sm font-bold gap-1"><AlertCircle className="w-4 h-4"/> Offline</span>
              ) : health ? (
                <span className="flex items-center text-emerald-400 text-sm font-bold gap-1"><CheckCircle2 className="w-4 h-4"/> Connected</span>
              ) : (
                <span className="text-amber-400 text-sm font-bold">Checking...</span>
              )}
            </div>
            <div className="w-px h-6 bg-slate-700"></div>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-slate-400" />
              <span className="font-medium text-sm">Model:</span>
              {health?.model_loaded ? (
                 <span className="flex items-center text-emerald-400 text-sm font-bold gap-1"><CheckCircle2 className="w-4 h-4"/> Loaded</span>
              ) : (
                 <span className="flex items-center text-red-400 text-sm font-bold gap-1"><AlertCircle className="w-4 h-4"/> Missing</span>
              )}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Input Form */}
          <div className="lg:col-span-2 bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" /> Audience Profile Builder
              </h2>
              <div className="flex gap-2">
                <button onClick={() => loadPreset(HIGH_ACTIVITY_PROFILE)} className="px-3 py-1.5 text-xs font-bold bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition">High Activity Preset</button>
                <button onClick={() => loadPreset(CASUAL_PROFILE)} className="px-3 py-1.5 text-xs font-bold bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition">Casual Preset</button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="col-span-full">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">User ID</label>
                  <input type="text" name="user_id" value={formData.user_id} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" />
                </div>
                {NUMERIC_FIELDS.map(field => (
                  <div key={field}>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 truncate" title={field}>
                      {field.replace(/_/g, ' ')}
                    </label>
                    <input 
                      type="number" 
                      step="any"
                      name={field} 
                      value={String((formData as any)[field])} 
                      onChange={handleChange} 
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" 
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-700 bg-slate-800/50">
              <button 
                onClick={handleAnalyze} 
                disabled={loading}
                className={cn(
                  "w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all",
                  loading ? "bg-slate-700 text-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 text-white"
                )}
              >
                {loading ? 'Analyzing...' : 'Analyze Audience Segment'}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            
            {/* Results Card */}
            <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden min-h-[300px] flex flex-col">
              <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50">
                <h2 className="text-xl font-bold text-white">Segmentation Results</h2>
              </div>
              
              <div className="p-6 flex-1 flex flex-col justify-center">
                {error ? (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
                    {error}
                  </div>
                ) : result ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                      <div className="text-sm font-medium text-slate-400 mb-1">Assigned Segment</div>
                      <div className="text-2xl font-black text-white">{result.segment_name}</div>
                      <div className="text-sm font-medium text-blue-400 mt-1">ID: {result.segment_id} • Centroid Dist: {result.distance_to_centroid.toFixed(4)}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-slate-400 mb-3">Targeted Recommendations</div>
                      <ul className="space-y-2">
                        {result.recommendations.map((rec, i) => (
                          <li key={i} className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 shadow-sm flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 font-medium">
                    Submit a profile to view segmentation results.
                  </div>
                )}
              </div>
            </div>

            {/* How It Works Card */}
            <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-6">
              <h3 className="text-lg font-bold text-white mb-4">How it works</h3>
              <div className="space-y-3">
                <div className="flex flex-col gap-1 items-center bg-slate-900 rounded-xl p-3 border border-slate-700">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Step 1</span>
                  <span className="font-medium text-sm text-white">User Behavior</span>
                </div>
                <div className="flex justify-center"><div className="w-0.5 h-4 bg-slate-700"></div></div>
                <div className="flex flex-col gap-1 items-center bg-slate-900 rounded-xl p-3 border border-slate-700">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Step 2</span>
                  <span className="font-medium text-sm text-white">Feature Processing (StandardScaler)</span>
                </div>
                <div className="flex justify-center"><div className="w-0.5 h-4 bg-slate-700"></div></div>
                <div className="flex flex-col gap-1 items-center bg-blue-900/30 rounded-xl p-3 border border-blue-500/30">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Step 3</span>
                  <span className="font-medium text-sm text-blue-100">KMeans Segmentation</span>
                </div>
                <div className="flex justify-center"><div className="w-0.5 h-4 bg-blue-500/30"></div></div>
                <div className="flex flex-col gap-1 items-center bg-emerald-900/30 rounded-xl p-3 border border-emerald-500/30">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Step 4</span>
                  <span className="font-medium text-sm text-emerald-100">Personalized Recommendations</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
