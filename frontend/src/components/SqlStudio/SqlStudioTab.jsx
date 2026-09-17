import React, { useState, useEffect } from 'react';
import {
  Database,
  Play,
  Download,
  Clock,
  AlertCircle,
  Table,
  Layers,
  FileText,
  Key,
  ChevronRight,
  ChevronDown,
  Info,
  Server,
  Activity,
  Code2,
  Copy,
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function SqlStudioTab() {
  const { user } = useAuth();
  const toast = useToast();
  const [query, setQuery] = useState('SELECT * FROM Users LIMIT 10;');
  const [presets, setPresets] = useState([]);
  const [schema, setSchema] = useState([]);
  const [results, setResults] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);
  const [error, setError] = useState(null);
  const [expandedTable, setExpandedTable] = useState(null);
  const [activeView, setActiveView] = useState('editor'); // 'editor' | 'dictionary'
  const [dbEngine, setDbEngine] = useState('DATABASE');

  // Load presets, schema, and engine info on mount
  useEffect(() => {
    async function loadMeta() {
      try {
        const [presetsData, schemaData, infoData] = await Promise.all([
          api.getSqlPresets(),
          api.getSqlSchema(),
          fetch(`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : ''}/api/info`).then(r => r.json()).catch(() => null),
        ]);
        if (presetsData?.presets) setPresets(presetsData.presets);
        if (schemaData?.tables) {
          setSchema(schemaData.tables);
          if (schemaData.tables.length > 0) {
            setExpandedTable(schemaData.tables[0].name || schemaData.tables[0].table_name);
          }
        }
        if (infoData?.database) setDbEngine(infoData.database);
      } catch (err) {
        console.error('Failed to load SQL metadata:', err);
      }
    }
    loadMeta();
  }, []);

  const totalRows = schema.reduce((acc, t) => acc + (t.row_count || 0), 0);
  const totalColumns = schema.reduce((acc, t) => acc + (t.columns?.length || 0), 0);

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
    toast.success('Exported to CSV! 📊');
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
    toast.success('Exported to JSON! 📄');
  };

  // Copy JSON to Clipboard
  const copyJson = async () => {
    if (!results?.rows || results.rows.length === 0) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(results.rows, null, 2));
      toast.success('Query output copied as JSON! 📋');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className="sql-studio-view">
      {/* Top Bar */}
      <div className="sql-header-bar">
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--blue-light)', color: 'var(--blue-primary)', fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: 'var(--radius-full)', letterSpacing: '0.5px', marginBottom: '6px' }}>
            <Server size={13} />
            <span>{dbEngine} DATABASE CONSOLE</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Database & SQL Studio</h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Full relational schema introspection and real-time SQL execution engine.
          </p>
        </div>

        <div className="sql-header-actions">
          <button
            type="button"
            className={`btn-secondary ${activeView === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveView('editor')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <Code2 size={13} />
            <span>Query Runner</span>
          </button>

          <button
            type="button"
            className={`btn-secondary ${activeView === 'dictionary' ? 'active' : ''}`}
            onClick={() => setActiveView('dictionary')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <Layers size={13} />
            <span>Data Dictionary ({schema.length})</span>
          </button>

          {activeView === 'editor' && (
            <>
              <button
                type="button"
                className="btn-secondary"
                onClick={exportCsv}
                disabled={!results?.rows?.length}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
              >
                <Download size={13} />
                <span>CSV</span>
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={handleExecute}
                disabled={executing}
                style={{ padding: '7px 14px', gap: '6px', fontSize: '12px', whiteSpace: 'nowrap' }}
              >
                <Play size={13} fill="currentColor" />
                <span>{executing ? 'Running...' : 'Execute'}</span>
                <kbd style={{ fontSize: '9px', background: 'rgba(255,255,255,0.2)', padding: '1px 4px', borderRadius: '3px' }}>
                  Ctrl+Enter
                </kbd>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Database Quick Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
        <div className="aside-card" style={{ padding: '12px 14px', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', background: 'var(--blue-light)', color: 'var(--blue-primary)', borderRadius: 'var(--radius-sm)' }}>
            <Table size={18} />
          </div>
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL TABLES</div>
            <div style={{ fontSize: '16px', fontWeight: 800 }}>{schema.length} Tables</div>
          </div>
        </div>

        <div className="aside-card" style={{ padding: '12px 14px', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', background: 'var(--green-light)', color: 'var(--green-accent)', borderRadius: 'var(--radius-sm)' }}>
            <Activity size={18} />
          </div>
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL RECORDS</div>
            <div style={{ fontSize: '16px', fontWeight: 800 }}>{totalRows} Rows</div>
          </div>
        </div>

        <div className="aside-card" style={{ padding: '12px 14px', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', background: 'var(--gold-light)', color: 'var(--gold-accent)', borderRadius: 'var(--radius-sm)' }}>
            <FileText size={18} />
          </div>
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)' }}>SCHEMA COLUMNS</div>
            <div style={{ fontSize: '16px', fontWeight: 800 }}>{totalColumns} Fields</div>
          </div>
        </div>

        <div className="aside-card" style={{ padding: '12px 14px', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', background: 'var(--bg-surface-secondary)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)' }}>
            <Database size={18} />
          </div>
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)' }}>DATABASE ENGINE</div>
            <div style={{ fontSize: '16px', fontWeight: 800 }}>{dbEngine}</div>
          </div>
        </div>
      </div>

      {/* VIEW 1: Query Runner & Schema Column */}
      {activeView === 'editor' && (
        <>
          {/* Preset Chips */}
          {presets.length > 0 && (
            <div className="sql-presets-tray">
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.6px', flexShrink: 0 }}>
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
            <div style={{ minWidth: 0, width: '100%' }}>
              {/* Query Editor */}
              <div className="sql-editor-card">
                <div style={{ padding: '8px 14px', background: '#27272a', color: '#a1a1aa', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>query.sql</span>
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
                  placeholder="Enter any SQL query (e.g. SELECT * FROM Users LIMIT 10;)"
                />
                <div style={{ padding: '8px 12px', background: '#1c1c24', borderTop: '1px solid #2a2a38', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                    Press <kbd style={{ background: '#2e2e3e', padding: '2px 5px', borderRadius: '3px', color: '#e5e7eb', fontSize: '10px' }}>Ctrl+Enter</kbd> to run
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery('')}
                        style={{ fontSize: '11.5px', padding: '5px 10px', color: '#9ca3af', background: 'transparent', border: '1px solid #3f3f46', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                      >
                        Clear
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleExecute}
                      disabled={executing}
                      style={{ padding: '6px 14px', fontSize: '12px', gap: '6px', whiteSpace: 'nowrap' }}
                    >
                      <Play size={13} fill="currentColor" />
                      <span>{executing ? 'Running...' : 'Execute Query'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Results Card */}
              <div className="sql-results-card">
                <div style={{ padding: '10px 16px', background: 'var(--bg-surface-secondary)', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)' }}>
                      QUERY OUTPUT
                    </span>
                    {executionTime && (
                      <span className="pro-badge-fast" title="Engine query latency">
                        <Clock size={11} />
                        <span>{executionTime}</span>
                      </span>
                    )}
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {results?.rows ? `${results.rows.length} rows` : 'No results'}
                    </span>
                    {results?.rows && results.rows.length > 0 && (
                      <span style={{ fontSize: '10.5px', color: 'var(--blue-primary)', background: 'var(--blue-light)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
                        ↔ Swipe table horizontally
                      </span>
                    )}
                  </div>

                  {results?.rows && results.rows.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        className="pro-btn"
                        onClick={copyJson}
                        title="Copy query rows as JSON"
                      >
                        <Copy size={13} />
                        <span>Copy JSON</span>
                      </button>
                      <button
                        type="button"
                        className="pro-btn"
                        onClick={exportCsv}
                        title="Export rows as CSV file"
                      >
                        <Download size={13} />
                        <span>Export CSV</span>
                      </button>
                    </div>
                  )}
                </div>

                {error ? (
                  <div style={{ padding: '20px', background: 'var(--red-light)', color: 'var(--red-accent)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)' }}>{error}</div>
                  </div>
                ) : results?.rows && results.rows.length > 0 ? (
                  <div className="table-scroll" style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'auto' }}>
                    <table className="sql-table" style={{ width: 'max-content', minWidth: '100%' }}>
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
                  {schema.length} tables
                </span>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Click table to generate SELECT query.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '520px', overflowY: 'auto' }}>
                {schema.map((tbl) => {
                  const name = tbl.name || tbl.table_name;
                  const isCur = expandedTable === name;
                  return (
                    <div key={name} style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 10px',
                          background: isCur ? 'var(--blue-light)' : 'var(--bg-surface-secondary)',
                          fontSize: '12.5px',
                          fontFamily: 'var(--font-mono)',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          setExpandedTable(isCur ? null : name);
                          setQuery(`SELECT * FROM ${name} LIMIT 10;`);
                        }}
                      >
                        <span style={{ fontWeight: 600, color: isCur ? 'var(--blue-primary)' : 'var(--text-primary)' }}>
                          {name}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {tbl.row_count !== undefined ? `${tbl.row_count} rows` : ''}
                        </span>
                      </div>

                      {/* Expandable column types */}
                      {isCur && tbl.columns && (
                        <div style={{ padding: '8px 10px', background: '#fff', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {tbl.columns.map((col) => (
                            <div key={col.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {col.pk && <Key size={10} color="var(--gold-accent)" />}
                                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: col.pk ? 700 : 500 }}>
                                  {col.name}
                                </span>
                              </div>
                              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                {col.type}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* VIEW 2: Complete Data Dictionary */}
      {activeView === 'dictionary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="aside-card">
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Complete 17-Table Schema Introspection</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Complete breakdown of every relational table, column definition, primary keys, and data types stored in {dbEngine}.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {schema.map((tbl) => {
              const name = tbl.name || tbl.table_name;
              return (
                <div key={name} className="aside-card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px', marginBottom: '8px' }}>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                        {name}
                      </h4>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {tbl.row_count !== undefined ? `${tbl.row_count} total rows` : ''}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ fontSize: '11px', padding: '3px 8px' }}
                      onClick={() => {
                        setQuery(`SELECT * FROM ${name} LIMIT 10;`);
                        setActiveView('editor');
                      }}
                    >
                      Query &rarr;
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {tbl.columns?.map((col) => (
                      <div
                        key={col.name}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '4px 6px',
                          background: 'var(--bg-surface-secondary)',
                          borderRadius: '4px',
                          fontSize: '11.5px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {col.pk && (
                            <span style={{ fontSize: '9px', fontWeight: 800, background: 'var(--gold-light)', color: 'var(--gold-accent)', padding: '1px 4px', borderRadius: '3px' }}>
                              PK
                            </span>
                          )}
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                            {col.name}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                            {col.type}
                          </span>
                          {col.notnull && (
                            <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                              NOT NULL
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
