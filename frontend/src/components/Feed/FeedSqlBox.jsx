import React, { useState } from 'react';
import { Database, Play, Terminal, Clock, Download, ChevronDown, ChevronUp, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';

const QUICK_PRESETS = [
  { label: 'All Users', query: 'SELECT user_id, username, email, bio, account_status FROM Users LIMIT 5;' },
  { label: 'Recent Posts', query: 'SELECT post_id, username, content, created_at FROM Post p JOIN Users u ON p.user_id = u.user_id ORDER BY created_at DESC LIMIT 5;' },
  { label: 'Communities', query: 'SELECT group_id, group_name, privacy, member_count FROM Community_Group;' },
  { label: 'Follow Graph', query: 'SELECT f.follower_id, u1.username AS follower, f.following_id, u2.username AS following FROM User_Follow f JOIN Users u1 ON f.follower_id = u1.user_id JOIN Users u2 ON f.following_id = u2.user_id LIMIT 5;' },
];

export default function FeedSqlBox({ onOpenFullStudio }) {
  const { user } = useAuth();
  const [query, setQuery] = useState('SELECT user_id, username, email, bio FROM Users LIMIT 5;');
  const [results, setResults] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleRunSql = async () => {
    if (!query.trim()) return;
    setExecuting(true);
    setError(null);
    const start = performance.now();

    try {
      const data = await api.executeSql(query.trim(), user?.user_id);
      const duration = (performance.now() - start).toFixed(1);
      setExecutionTime(data.execution_time_ms ? `${data.execution_time_ms.toFixed(1)}ms` : `${duration}ms`);
      setResults(data);
      setIsExpanded(true);
    } catch (err) {
      setError(err.message || 'SQL execution failed');
      setResults(null);
      setIsExpanded(true);
    } finally {
      setExecuting(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRunSql();
    }
  };

  const exportCsv = () => {
    if (!results?.rows || results.rows.length === 0) return;
    const cols = results.columns || Object.keys(results.rows[0]);
    const lines = [cols.join(',')];
    results.rows.forEach((row) => {
      const vals = cols.map((c) => {
        const val = row[c] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      lines.push(vals.join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_feed_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="create-post-card" id="feedSqlBoxSection" style={{ padding: '16px 18px', gap: '14px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ padding: '6px', background: 'var(--blue-light)', color: 'var(--blue-primary)', borderRadius: 'var(--radius-sm)', display: 'flex' }}>
            <Terminal size={18} />
          </div>
          <div>
            <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              SQL Queries & Live Database Workbench
            </h4>
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              Execute live SQLite queries across all 17 relational tables
            </span>
          </div>
        </div>

        {onOpenFullStudio && (
          <button
            type="button"
            className="btn-text-sm"
            onClick={onOpenFullStudio}
            style={{ color: 'var(--blue-primary)', fontWeight: 700, fontSize: '12px' }}
          >
            Full Studio &rarr;
          </button>
        )}
      </div>

      {/* Quick Presets Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
          QUICK QUERIES:
        </span>
        {QUICK_PRESETS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            className="btn-secondary"
            style={{ fontSize: '11.5px', padding: '4px 10px', borderRadius: 'var(--radius-full)' }}
            onClick={() => {
              setQuery(p.query);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* SQL Editor Input */}
      <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-default)', background: '#18181b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: '#27272a', color: '#a1a1aa', fontSize: '11.5px' }}>
          <span style={{ fontFamily: 'var(--font-mono)' }}>interactive_query.sql</span>
          <span style={{ color: executing ? 'var(--gold-accent)' : 'var(--green-accent)', fontWeight: 700, fontSize: '10.5px' }}>
            {executing ? 'EXECUTING...' : 'READY'}
          </span>
        </div>
        <textarea
          className="sql-editor-textarea"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter SQL query (e.g. SELECT * FROM Users LIMIT 10;)"
          spellCheck="false"
          style={{ height: '86px', fontSize: '13px', padding: '12px', width: '100%', border: 'none', background: '#18181b', color: '#f4f4f5' }}
        />
      </div>

      {/* Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
          Press <kbd style={{ background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-subtle)', padding: '1px 5px', borderRadius: '4px', fontSize: '10.5px' }}>Ctrl + Enter</kbd> to execute
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {results?.rows?.length > 0 && (
            <button
              type="button"
              className="btn-secondary"
              onClick={exportCsv}
              style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          )}

          <button
            type="button"
            className="btn-primary"
            disabled={executing || !query.trim()}
            onClick={handleRunSql}
            style={{ padding: '7px 18px', fontSize: '13px' }}
          >
            <Play size={14} fill="currentColor" />
            <span>{executing ? 'Executing...' : 'Run SQL'}</span>
          </button>
        </div>
      </div>

      {/* Live Output Section */}
      {(results || error) && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none', marginBottom: '8px' }}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)' }}>
                QUERY RESULTS
              </span>
              {executionTime && (
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--blue-primary)', background: 'var(--blue-light)', padding: '2px 8px', borderRadius: 'var(--radius-full)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <Clock size={11} />
                  <span>{executionTime}</span>
                </span>
              )}
              {results?.rows && (
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  ({results.rows.length} row{results.rows.length === 1 ? '' : 's'})
                </span>
              )}
            </div>
            <button type="button" style={{ color: 'var(--text-muted)', padding: '2px' }}>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {isExpanded && (
            <>
              {error ? (
                <div style={{ padding: '12px 14px', background: 'var(--red-light)', color: 'var(--red-accent)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', fontFamily: 'var(--font-mono)' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>{error}</div>
                </div>
              ) : results?.rows && results.rows.length > 0 ? (
                <div className="table-scroll" style={{ maxHeight: '280px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <table className="sql-table">
                    <thead>
                      <tr>
                        {(results.columns || Object.keys(results.rows[0])).map((col) => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.rows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {(results.columns || Object.keys(results.rows[0])).map((col) => (
                            <td key={col}>{String(row[col] ?? 'NULL')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px' }}>
                  Query executed successfully with 0 rows returned.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
