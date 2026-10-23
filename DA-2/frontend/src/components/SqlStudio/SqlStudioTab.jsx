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
  Server,
  Activity,
  Code2,
  Copy,
  Users,
  UserPlus,
  Trash2,
  Search,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  X,
  ExternalLink,
  Shield,
  MapPin,
  Mail,
  Heart,
  MessageSquare,
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
];

export default function SqlStudioTab() {
  const { user } = useAuth();
  const toast = useToast();
  const [query, setQuery] = useState('SELECT * FROM Users ORDER BY user_id DESC LIMIT 10;');
  const [presets, setPresets] = useState([]);
  const [schema, setSchema] = useState([]);
  const [results, setResults] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);
  const [error, setError] = useState(null);
  const [expandedTable, setExpandedTable] = useState(null);
  const [activeView, setActiveView] = useState('editor'); // 'editor' | 'people' | 'dictionary'
  const [dbEngine, setDbEngine] = useState('DATABASE');

  // People State
  const [people, setPeople] = useState([]);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [peopleSearch, setPeopleSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingPerson, setDeletingPerson] = useState(null);
  const [isSubmittingPerson, setIsSubmittingPerson] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add Person Form State
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('Password123!');
  const [formBio, setFormBio] = useState('Systems developer & database enthusiast');
  const [formLocation, setFormLocation] = useState('San Francisco, CA');
  const [formInterests, setFormInterests] = useState('Databases, SQL, Distributed Systems');
  const [formRole, setFormRole] = useState('USER');
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [formProfilePic, setFormProfilePic] = useState(AVATAR_PRESETS[0]);

  // Load presets, schema, and engine info on mount
  const loadMeta = async () => {
    try {
      const [presetsData, schemaData, infoData] = await Promise.all([
        api.getSqlPresets(),
        api.getSqlSchema(),
        fetch(`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : ''}/api/info`).then(r => r.json()).catch(() => null),
      ]);
      if (presetsData?.presets) setPresets(presetsData.presets);
      if (schemaData?.tables) {
        setSchema(schemaData.tables);
        if (!expandedTable && schemaData.tables.length > 0) {
          setExpandedTable(schemaData.tables[0].name || schemaData.tables[0].table_name);
        }
      }
      if (infoData?.database) setDbEngine(infoData.database);
    } catch (err) {
      console.error('Failed to load SQL metadata:', err);
    }
  };

  // Load People list
  const loadPeople = async () => {
    setLoadingPeople(true);
    try {
      const data = await api.getSqlPeople();
      if (data?.people) {
        setPeople(data.people);
      }
    } catch (err) {
      console.error('Failed to load people:', err);
      toast.error('Failed to fetch people list from database');
    } finally {
      setLoadingPeople(false);
    }
  };

  useEffect(() => {
    loadMeta();
    loadPeople();
  }, []);

  const totalRows = schema.reduce((acc, t) => acc + (t.row_count || 0), 0);
  const totalColumns = schema.reduce((acc, t) => acc + (t.columns?.length || 0), 0);

  // Execute SQL Query
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

      if (['INSERT', 'DELETE', 'UPDATE', 'REPLACE'].includes(data.query_type)) {
        toast.success(data.message || 'Mutation executed successfully!');
        // Refresh people and schema stats
        loadMeta();
        loadPeople();
      }
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

  // Quick 1-Click Insert Sample Person
  const handleQuickInsertSample = async () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const sampleNames = ['elena_sys', 'marcus_db', 'charlotte_dev', 'liam_cloud', 'maya_ai'];
    const chosenName = `${sampleNames[Math.floor(Math.random() * sampleNames.length)]}_${randomSuffix}`;
    const payload = {
      username: chosenName,
      email: `${chosenName}@socialsphere.io`,
      password: 'Password123!',
      bio: 'Cloud architecture & database performance engineer',
      location: 'Zurich, Switzerland',
      interests: 'MySQL, Distributed DBs, React, Python',
      role: 'USER',
      account_status: 'ACTIVE',
      profile_pic: AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)],
    };

    try {
      const res = await api.insertSqlPerson(payload);
      toast.success(`Inserted ${chosenName} into database! 🚀`);
      loadPeople();
      loadMeta();
    } catch (err) {
      toast.error(err.message || 'Failed to insert sample person');
    }
  };

  // Submit Add Person Modal
  const handleSubmitAddPerson = async (e) => {
    e.preventDefault();
    if (!formUsername.trim()) {
      toast.error('Please enter a username');
      return;
    }

    setIsSubmittingPerson(true);
    try {
      const payload = {
        username: formUsername.trim(),
        email: formEmail.trim() || undefined,
        password: formPassword || 'Password123!',
        bio: formBio,
        location: formLocation,
        interests: formInterests,
        role: formRole,
        account_status: formStatus,
        profile_pic: formProfilePic,
      };

      const res = await api.insertSqlPerson(payload);
      toast.success(res.message || 'Person successfully inserted into database!');
      setShowAddModal(false);
      // Reset form
      setFormUsername('');
      setFormEmail('');
      loadPeople();
      loadMeta();
    } catch (err) {
      toast.error(err.message || 'Error inserting person');
    } finally {
      setIsSubmittingPerson(false);
    }
  };

  // Open Add Person in Query Runner instead
  const handleOpenAddInRunner = () => {
    const u = formUsername.trim() || 'alex_developer';
    const em = formEmail.trim() || `${u}@socialsphere.io`;
    const escapedBio = (formBio || 'Fullstack software engineer').replace(/'/g, "''");
    const sqlQuery = `INSERT INTO Users (username, email, password, bio, account_status, dob)\nVALUES ('${u}', '${em}', 'Password123!', '${escapedBio}', '${formStatus}', '2000-01-01');`;
    setQuery(sqlQuery);
    setActiveView('editor');
    setShowAddModal(false);
    toast.info('Loaded INSERT statement into SQL Query Runner!');
  };

  // Submit Delete Person Modal
  const handleConfirmDeletePerson = async () => {
    if (!deletingPerson) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteSqlPerson(deletingPerson.user_id);
      toast.success(res.message || `Deleted ${deletingPerson.username} from database!`);
      setDeletingPerson(null);
      loadPeople();
      loadMeta();
    } catch (err) {
      toast.error(err.message || 'Error deleting person');
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Delete in Query Runner
  const handleOpenDeleteInRunner = (person) => {
    const sqlQuery = `DELETE FROM Users WHERE user_id = ${person.user_id}; -- Cascades and removes credentials and posts`;
    setQuery(sqlQuery);
    setActiveView('editor');
    setDeletingPerson(null);
    toast.info('Loaded DELETE statement into SQL Query Runner!');
  };

  // Filtered People
  const filteredPeople = people.filter((p) => {
    const matchesSearch =
      peopleSearch === '' ||
      p.username?.toLowerCase().includes(peopleSearch.toLowerCase()) ||
      p.email?.toLowerCase().includes(peopleSearch.toLowerCase()) ||
      p.location?.toLowerCase().includes(peopleSearch.toLowerCase()) ||
      p.bio?.toLowerCase().includes(peopleSearch.toLowerCase());

    const matchesRole =
      roleFilter === 'ALL' ||
      (roleFilter === 'SUPER_ADMIN' && (p.admin_level === 'SUPER_ADMIN' || p.account_role === 'SUPER_ADMIN')) ||
      (roleFilter === 'OPS_ADMIN' && (p.admin_level === 'OPS_ADMIN' || p.account_role === 'OPS_ADMIN')) ||
      (roleFilter === 'USER' && (!p.admin_level || p.admin_level === 'USER') && p.account_role !== 'SUPER_ADMIN' && p.account_role !== 'OPS_ADMIN');

    const matchesStatus =
      statusFilter === 'ALL' || (p.account_status || 'ACTIVE').toUpperCase() === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

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

  // Active DML check
  const isDmlResult =
    results &&
    (results.rows_affected !== undefined ||
      ['INSERT', 'DELETE', 'UPDATE', 'REPLACE'].includes(results.query_type));

  return (
    <div className="sql-studio-view">
      {/* Top Bar */}
      <div className="sql-header-bar">
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--blue-light)', color: 'var(--blue-primary)', fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: 'var(--radius-full)', letterSpacing: '0.5px', marginBottom: '6px' }}>
            <Server size={13} />
            <span>{dbEngine} DATABASE CONSOLE</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Database &amp; SQL Studio</h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Full relational schema introspection, interactive People directory with INSERT/DELETE, and live SQL execution engine.
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
            className={`btn-secondary ${activeView === 'people' ? 'active' : ''}`}
            onClick={() => {
              setActiveView('people');
              loadPeople();
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <Users size={13} />
            <span>People Studio ({people.length})</span>
          </button>

          <button
            type="button"
            className={`btn-secondary ${activeView === 'dictionary' ? 'active' : ''}`}
            onClick={() => setActiveView('dictionary')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <Layers size={13} />
            <span>Schema Dictionary ({schema.length})</span>
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

          {activeView === 'people' && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowAddModal(true)}
              style={{ padding: '7px 14px', gap: '6px', fontSize: '12px', whiteSpace: 'nowrap' }}
            >
              <UserPlus size={14} />
              <span>+ Add Person</span>
            </button>
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

        <div className="aside-card" style={{ padding: '12px 14px', flexDirection: 'row', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setActiveView('people')}>
          <div style={{ padding: '8px', background: 'var(--clay-light, rgba(194, 107, 77, 0.12))', color: 'var(--clay, #c26b4d)', borderRadius: 'var(--radius-sm)' }}>
            <Users size={18} />
          </div>
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)' }}>DATABASE PEOPLE</div>
            <div style={{ fontSize: '16px', fontWeight: 800 }}>{people.length} People</div>
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
              {presets.map((p, idx) => {
                const isMutation = p.id?.includes('insert') || p.id?.includes('delete') || p.id?.includes('update');
                return (
                  <button
                    key={idx}
                    type="button"
                    className="sql-preset-chip"
                    style={isMutation ? { borderColor: 'rgba(194, 107, 77, 0.4)', color: 'var(--clay, #c26b4d)', background: 'rgba(194, 107, 77, 0.05)' } : {}}
                    onClick={() => {
                      setQuery(p.query || p.sql);
                    }}
                  >
                    {isMutation ? '⚡ ' : ''}{p.title || p.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Workspace Grid */}
          <div className="sql-workspace">
            <div style={{ minWidth: 0, width: '100%' }}>
              {/* Query Editor */}
              <div className="sql-editor-card">
                <div style={{ padding: '8px 14px', background: '#27272a', color: '#a1a1aa', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>query.sql</span>
                    <span style={{ fontSize: '10.5px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#e4e4e7' }}>
                      Supports SELECT, INSERT, UPDATE, DELETE
                    </span>
                  </div>
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
                  placeholder="Enter any SQL query (e.g. SELECT * FROM Users; or INSERT INTO Users... or DELETE FROM Users WHERE...)"
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
                      {results?.rows ? `${results.rows.length} rows` : results?.rows_affected !== undefined ? `${results.rows_affected} rows affected` : 'No results'}
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
                ) : isDmlResult && (!results.rows || results.rows.length === 0) ? (
                  /* DML Successful Mutation Card (INSERT / UPDATE / DELETE) */
                  <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-surface)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--green-light)', color: 'var(--green-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: results.query_type === 'DELETE' ? 'var(--red-light)' : 'var(--green-light)', color: results.query_type === 'DELETE' ? 'var(--red-accent)' : 'var(--green-accent)', fontFamily: 'var(--font-mono)' }}>
                            {results.query_type || 'MUTATION'} SUCCESSFUL
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Execution time: {executionTime}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
                          {results.message}
                        </h3>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginTop: '6px' }}>
                      <div style={{ padding: '10px 14px', background: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>ROWS AFFECTED</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{results.rows_affected ?? 0}</div>
                      </div>
                      {results.last_row_id && (
                        <div style={{ padding: '10px 14px', background: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>INSERTED ID</div>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--blue-primary)', marginTop: '2px' }}>#{results.last_row_id}</div>
                        </div>
                      )}
                      <div style={{ padding: '10px 14px', background: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>STORAGE COMMIT</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--green-accent)', marginTop: '5px' }}>✓ Committed</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                          setActiveView('people');
                          loadPeople();
                        }}
                        style={{ fontSize: '12px', padding: '7px 14px', gap: '6px' }}
                      >
                        <Users size={13} />
                        <span>View in People Studio</span>
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          setQuery('SELECT * FROM Users ORDER BY user_id DESC LIMIT 10;');
                          handleExecute();
                        }}
                        style={{ fontSize: '12px', padding: '7px 14px', gap: '6px' }}
                      >
                        <RefreshCw size={13} />
                        <span>Query Users Table</span>
                      </button>
                    </div>
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
                    Select a preset or execute a query (SELECT, INSERT, UPDATE, DELETE) to view live relational results.
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

      {/* VIEW 2: Interactive People Studio */}
      {activeView === 'people' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Controls Bar */}
          <div className="aside-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Database People &amp; Users Directory</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Live records mapped from relational tables <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--blue-primary)' }}>Users</code>, <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--blue-primary)' }}>User_Credentials</code>, <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--blue-primary)' }}>Profile_Pic</code>, and <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--blue-primary)' }}>Regular_User</code>.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleQuickInsertSample}
                  title="Insert a sample realistic person with 1-click"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
                >
                  <Sparkles size={14} color="var(--gold-accent)" />
                  <span>1-Click Sample Person</span>
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setShowAddModal(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
                >
                  <UserPlus size={14} />
                  <span>Insert Person...</span>
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={loadPeople}
                  disabled={loadingPeople}
                  title="Reload list from database"
                  style={{ padding: '7px 10px', display: 'inline-flex', alignItems: 'center' }}
                >
                  <RefreshCw size={14} className={loadingPeople ? 'spin' : ''} />
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search by username, email, location..."
                  value={peopleSearch}
                  onChange={(e) => setPeopleSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 14px 8px 36px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-surface-secondary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Role:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: '12px', background: 'var(--bg-surface)' }}
                >
                  <option value="ALL">All Roles</option>
                  <option value="USER">Standard User</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="OPS_ADMIN">Ops Admin</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: '12px', background: 'var(--bg-surface)' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>

              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                Showing <b>{filteredPeople.length}</b> of {people.length}
              </span>
            </div>
          </div>

          {/* People Records Table */}
          <div className="sql-results-card" style={{ margin: 0 }}>
            <div className="table-scroll" style={{ width: '100%', overflowX: 'auto' }}>
              <table className="sql-table" style={{ width: '100%', minWidth: '800px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '220px' }}>Person</th>
                    <th>Email</th>
                    <th>Role &amp; Status</th>
                    <th>Bio &amp; Location</th>
                    <th>Activity</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPeople.map((person) => {
                    const isSuper = person.admin_level === 'SUPER_ADMIN' || person.account_role === 'SUPER_ADMIN';
                    const isOps = person.admin_level === 'OPS_ADMIN' || person.account_role === 'OPS_ADMIN';
                    const status = person.account_status || 'ACTIVE';

                    return (
                      <tr key={person.user_id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img
                              src={person.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                              alt={person.username}
                              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border-subtle)' }}
                            />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                                  {person.username}
                                </span>
                                <span style={{ fontSize: '10px', background: 'var(--bg-surface-secondary)', color: 'var(--text-muted)', padding: '1px 5px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                                  #{person.user_id}
                                </span>
                              </div>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {person.interests || 'Member'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                            {person.email}
                          </span>
                        </td>

                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                            {isSuper ? (
                              <span style={{ fontSize: '10.5px', fontWeight: 800, background: 'var(--gold-light)', color: 'var(--gold-accent)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                                ★ SUPER ADMIN
                              </span>
                            ) : isOps ? (
                              <span style={{ fontSize: '10.5px', fontWeight: 800, background: 'var(--blue-light)', color: 'var(--blue-primary)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                                OPS ADMIN
                              </span>
                            ) : (
                              <span style={{ fontSize: '10.5px', fontWeight: 700, background: 'var(--bg-surface-secondary)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                                USER
                              </span>
                            )}

                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                color: status === 'ACTIVE' ? 'var(--green-accent)' : status === 'SUSPENDED' ? 'var(--red-accent)' : 'var(--gold-accent)',
                              }}
                            >
                              ● {status}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div style={{ maxWidth: '280px' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={person.bio}>
                              {person.bio || '—'}
                            </div>
                            {person.location && (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                <MapPin size={10} />
                                <span>{person.location}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                            <span>{person.posts_count || 0} posts</span> • <span>{person.followers_count || 0} followers</span>
                          </div>
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ fontSize: '11px', padding: '4px 8px' }}
                              onClick={() => {
                                setQuery(`SELECT * FROM Users WHERE user_id = ${person.user_id};`);
                                setActiveView('editor');
                              }}
                              title="Query this person in SQL Editor"
                            >
                              <Code2 size={12} />
                              <span>SQL</span>
                            </button>

                            <button
                              type="button"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                padding: '4px 8px',
                                background: 'var(--red-light)',
                                color: 'var(--red-accent)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                              }}
                              onClick={() => setDeletingPerson(person)}
                              title="Delete person from database"
                            >
                              <Trash2 size={12} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredPeople.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {loadingPeople ? 'Loading database people...' : 'No people found matching your search filters.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Complete Data Dictionary */}
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

      {/* MODAL 1: Add Person / Insert into Database */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowAddModal(false)}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', background: 'var(--clay-light, rgba(194, 107, 77, 0.12))', color: 'var(--clay, #c26b4d)', borderRadius: 'var(--radius-sm)' }}>
                <UserPlus size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Insert Person into Database</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  Executes relational INSERT statements across Users, User_Credentials, Profile_Pic, and Regular_User tables.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitAddPerson} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '6px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Username <span style={{ color: 'var(--red-accent)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. sophia_ai"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: '13px', background: 'var(--bg-surface)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder={formUsername ? `${formUsername.toLowerCase()}@socialsphere.io` : 'user@socialsphere.io'}
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: '13px', background: 'var(--bg-surface)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Password123!"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: '13px', background: 'var(--bg-surface)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Role
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: '13px', background: 'var(--bg-surface)' }}
                  >
                    <option value="USER">USER</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    <option value="OPS_ADMIN">OPS_ADMIN</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: '13px', background: 'var(--bg-surface)' }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PENDING">PENDING</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Bio
                </label>
                <textarea
                  rows={2}
                  placeholder="Tell us about this person..."
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: '13px', background: 'var(--bg-surface)', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tokyo, Japan"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: '13px', background: 'var(--bg-surface)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Interests
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Distributed SQL, Machine Learning"
                    value={formInterests}
                    onChange={(e) => setFormInterests(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: '13px', background: 'var(--bg-surface)' }}
                  />
                </div>
              </div>

              {/* Avatar Selector */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Select Avatar Preset
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {AVATAR_PRESETS.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="avatar"
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        cursor: 'pointer',
                        border: formProfilePic === url ? '3px solid var(--blue-primary)' : '2px solid transparent',
                        transform: formProfilePic === url ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.15s ease',
                      }}
                      onClick={() => setFormProfilePic(url)}
                    />
                  ))}
                </div>
              </div>

              {/* Live SQL Preview Box */}
              <div style={{ background: '#18181b', borderRadius: 'var(--radius-md)', padding: '12px', border: '1px solid #27272a' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#a1a1aa', letterSpacing: '0.5px' }}>
                    LIVE GENERATED SQL COMMAND:
                  </span>
                  <span style={{ fontSize: '10.5px', color: 'var(--gold-accent)', fontFamily: 'var(--font-mono)' }}>
                    Auto-generated DML
                  </span>
                </div>
                <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: '#e4e4e7', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
{`INSERT INTO Users (username, email, password, bio, account_status, dob)
VALUES ('${formUsername || 'username'}', '${formEmail || (formUsername ? formUsername.toLowerCase() + '@socialsphere.io' : 'email@example.com')}', '[HASHED_PASSWORD]', '${formBio.replace(/'/g, "''")}', '${formStatus}', '2000-01-01');

INSERT INTO User_Credentials (user_id, username, password_hash, account_role)
VALUES (LAST_INSERT_ID(), '${formUsername || 'username'}', '[HASHED_PASSWORD]', '${formRole}');`}
                </pre>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleOpenAddInRunner}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ExternalLink size={13} />
                  <span>Open in SQL Runner</span>
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmittingPerson || !formUsername.trim()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <UserPlus size={14} />
                  <span>{isSubmittingPerson ? 'Inserting...' : 'Insert Person into Database'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Delete Person Confirmation */}
      {deletingPerson && (
        <div className="modal-overlay" onClick={() => setDeletingPerson(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setDeletingPerson(null)}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--red-light)', color: 'var(--red-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--red-accent)' }}>Delete Person from Database?</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Are you sure you want to delete person <b>{deletingPerson.username}</b> (ID #{deletingPerson.user_id})?
                </p>
              </div>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Foreign Key Cascade Notice:
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                This operation will delete the record from <code style={{ fontFamily: 'var(--font-mono)' }}>Users</code> and automatically cascade to delete all associated credentials, profile photos, posts, and comments.
              </div>
            </div>

            {/* SQL Command Preview */}
            <div style={{ background: '#18181b', borderRadius: 'var(--radius-sm)', padding: '10px 14px', border: '1px solid #27272a' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#a1a1aa', marginBottom: '4px' }}>
                EXECUTED SQL COMMAND:
              </div>
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#f87171' }}>
                DELETE FROM Users WHERE user_id = {deletingPerson.user_id};
              </code>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeletingPerson(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleOpenDeleteInRunner(deletingPerson)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Code2 size={13} />
                <span>Open in SQL Runner</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmDeletePerson}
                disabled={isDeleting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--red-accent)',
                  color: '#fff',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={13} />
                <span>{isDeleting ? 'Deleting...' : 'Confirm & Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
