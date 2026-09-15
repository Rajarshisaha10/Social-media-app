import React, { useState, useEffect } from 'react';
import { Database, Play, Download, Clock, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function SqlStudioTab() {
  const { user } = useAuth();
  const [query, setQuery] = useState('SELECT * FROM Users LIMIT 10;');
  const [presets, setPresets] = useState([]);
  const [schema, setSchema] = useState([]);
  const [results, setResults] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);
  const [error, setError] = useState(null);

  // Load presets and schema on mount
  useEffect(() => {
    async function loadMeta() {
      try {
        const [presetsData, schemaData] = await Promise.all([
          api.getSqlPresets(),
          api.getSqlSchema(),
        ]);
        if (presetsData?.presets) setPresets(presetsData.presets);
        if (schemaData?.tables) setSchema(schemaData.tables);
      } catch (err) {
        console.error('Failed to load SQL metadata:', err);
      }
    }
    loadMeta();
  }, []);

  const handleExecute = async () => {
    if (!query.trim()) return;
    setExecuting(true);
    setError(null);
    const start = performance.now();

    try {
      const data = await api.executeSql(query.trim(), user?.user_id);
      const duration = (performance.now() - start).toFixed(1);
      setExecutionTime(data.execution_time_ms ? `${data.execution_time_ms.toFixed(1)}ms` : `${duration}ms`);
      setResults(data);
    } catch (err) {
      setError(err.message || 'Execution error');
      setResults(null);
    } finally {
      setExecuting(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  // CSV Export
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
    a.download = `query_result_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // JSON Export
  const exportJson = () => {
    if (!results?.rows) return;
    const blob = new Blob([JSON.stringify(results.rows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_result_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="sql-studio-view">
      <div className="sql-header-bar">
        <div>
          <div style={{ display: 'inline-block', background: 'var(--red-accent)', color: '#fff', fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: 'var(--radius-full)', letterSpacing: '0.6px', marginBottom: '4px' }}>
            SUPER ADMIN ACCESS
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800 }}>Relational /sql Studio</h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Execute live queries against SQLite with millisecond execution timing and relational schema inspector.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={exportCsv}
            disabled={!results?.rows?.length}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
          >
            <Download size={14} />
            <span>CSV</span>
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={exportJson}
            disabled={!results?.rows?.length}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
          >
            <Download size={14} />
            <span>JSON</span>
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleExecute}
            disabled={executing}
            style={{ padding: '8px 18px', gap: '8px' }}
          >
            <Play size={15} fill="currentColor" />
            <span>{executing ? 'Running...' : 'Execute'}</span>
            <kbd style={{ fontSize: '10px', background: 'rgba(255,255,255,0.2)', padding: '1px 5px', borderRadius: '4px' }}>
              Ctrl+Enter
            </kbd>
          </button>
        </div>
      </div>

      {/* Preset Chips */}
      {presets.length > 0 && (
        <div className="sql-presets-tray">
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.6px' }}>
            PRESETS:
          </span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              className="sql-preset-chip"
              onClick={() => {
                setQuery(p.query || p.sql);
              }}
            >
              {p.title || p.name}
            </button>
          ))}
        </div>
      )}

      {/* Workspace Grid */}
      <div className="sql-workspace">
        <div>
          {/* Query Editor */}
          <div className="sql-editor-card">
            <div style={{ padding: '8px 14px', background: '#27272a', color: '#a1a1aa', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>query.sql</span>
              <span style={{ color: executing ? 'var(--gold-accent)' : 'var(--green-accent)', fontWeight: 700, fontSize: '11px' }}>
                {executing ? 'RUNNING...' : 'READY'}
              </span>
            </div>
            <textarea
              className="sql-editor-textarea"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck="false"
            />
          </div>

          {/* Results Card */}
          <div className="sql-results-card">
            <div style={{ padding: '10px 16px', background: 'var(--bg-surface-secondary)', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)' }}>
                QUERY OUTPUT
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {executionTime && (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--blue-primary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Clock size={12} />
                    <span>{executionTime}</span>
                  </span>
                )}
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {results?.rows ? `${results.rows.length} rows returned` : 'No results'}
                </span>
              </div>
            </div>

            {error ? (
              <div style={{ padding: '20px', background: 'var(--red-light)', color: 'var(--red-accent)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <AlertCircle size={18} />
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)' }}>{error}</div>
              </div>
            ) : results?.rows && results.rows.length > 0 ? (
              <div className="table-scroll">
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
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Select a preset or execute a query to view live relational rows.
              </div>
            )}
          </div>
        </div>

        {/* Schema Inspector Column */}
        <div className="aside-card" style={{ height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="aside-card-title">Database Tables</span>
            <span style={{ fontSize: '11px', fontWeight: 800, background: 'var(--blue-light)', color: 'var(--blue-primary)', padding: '2px 6px', borderRadius: 'var(--radius-full)' }}>
              {schema.length || 15}
            </span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Click table name to generate query.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '520px', overflowY: 'auto' }}>
            {schema.map((tbl) => {
              const name = tbl.name || tbl.table_name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setQuery(`SELECT * FROM ${name} LIMIT 10;`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface-secondary)',
                    fontSize: '12.5px',
                    fontFamily: 'var(--font-mono)',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{name}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {tbl.row_count !== undefined ? `${tbl.row_count} rows` : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
