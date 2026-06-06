import React, { useState, useMemo } from 'react';
import { Search, Plus, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';

type AnimalStatus = 'Активное' | 'На лечении' | 'Наблюдение';

interface RegistryAnimal {
  id: number;
  tag_number: string;
  species: string;
  breed: string;
  weight: number;
  status: AnimalStatus;
}

const INITIAL_DATA: RegistryAnimal[] = [
  { id: 1,  tag_number: 'A-001', species: 'Корова', breed: 'Голштинская',    weight: 580, status: 'Активное' },
  { id: 2,  tag_number: 'A-002', species: 'Корова', breed: 'Джерсейская',    weight: 460, status: 'Активное' },
  { id: 3,  tag_number: 'A-003', species: 'Корова', breed: 'Холмогорская',   weight: 620, status: 'На лечении' },
  { id: 4,  tag_number: 'A-004', species: 'Корова', breed: 'Айрширская',     weight: 510, status: 'Активное' },
  { id: 5,  tag_number: 'A-005', species: 'Корова', breed: 'Голштинская',    weight: 720, status: 'Наблюдение' },
  { id: 6,  tag_number: 'A-006', species: 'Корова', breed: 'Симментальская', weight: 680, status: 'Активное' },
  { id: 7,  tag_number: 'B-001', species: 'Овца',   breed: 'Романовская',    weight: 65,  status: 'Активное' },
  { id: 8,  tag_number: 'B-002', species: 'Овца',   breed: 'Меринос',        weight: 55,  status: 'На лечении' },
  { id: 9,  tag_number: 'B-003', species: 'Овца',   breed: 'Суффолк',        weight: 78,  status: 'Активное' },
  { id: 10, tag_number: 'B-004', species: 'Овца',   breed: 'Куйбышевская',   weight: 70,  status: 'Наблюдение' },
  { id: 11, tag_number: 'B-005', species: 'Овца',   breed: 'Романовская',    weight: 60,  status: 'Активное' },
  { id: 12, tag_number: 'C-001', species: 'Коза',   breed: 'Зааненская',     weight: 62,  status: 'Активное' },
  { id: 13, tag_number: 'C-002', species: 'Коза',   breed: 'Альпийская',     weight: 55,  status: 'Наблюдение' },
  { id: 14, tag_number: 'C-003', species: 'Коза',   breed: 'Нубийская',      weight: 70,  status: 'Активное' },
  { id: 15, tag_number: 'C-004', species: 'Коза',   breed: 'Зааненская',     weight: 48,  status: 'На лечении' },
  { id: 16, tag_number: 'C-005', species: 'Коза',   breed: 'Тоггенбургская', weight: 52,  status: 'Активное' },
];

type SortKey = 'id' | 'tag_number' | 'species' | 'breed' | 'weight' | 'status';
type SortDir = 'asc' | 'desc' | null;

const STATUS_STYLES: Record<AnimalStatus, string> = {
  'Активное':   'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  'На лечении': 'bg-orange-500/15  text-orange-300  border border-orange-500/30',
  'Наблюдение': 'bg-yellow-500/15  text-yellow-300  border border-yellow-500/30',
};

const STATUS_DOT: Record<AnimalStatus, string> = {
  'Активное':   'bg-emerald-400',
  'На лечении': 'bg-orange-400',
  'Наблюдение': 'bg-yellow-400',
};

const SORTABLE_HEADERS: { key: SortKey; label: string }[] = [
  { key: 'id',         label: 'ID / Метка' },
  { key: 'tag_number', label: 'Номер бирки' },
  { key: 'species',    label: 'Вид' },
  { key: 'breed',      label: 'Порода' },
  { key: 'weight',     label: 'Вес (кг)' },
  { key: 'status',     label: 'Статус' },
];

const AnimalRegistry: React.FC = () => {
  const [data, setData] = useState<RegistryAnimal[]>(INITIAL_DATA);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AnimalStatus | 'Все'>('Все');
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAnimal, setNewAnimal] = useState<Omit<RegistryAnimal, 'id'>>({
    tag_number: '',
    species: 'Корова',
    breed: '',
    weight: 0,
    status: 'Активное',
  });

  const handleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
    } else if (sortDir === 'asc') {
      setSortDir('desc');
    } else {
      setSortKey(null);
      setSortDir(null);
    }
  };

  const SortIcon: React.FC<{ col: SortKey }> = ({ col }) => {
    if (sortKey !== col) return <ArrowUpDown size={14} className="text-gray-500" />;
    if (sortDir === 'asc') return <ArrowUp size={14} className="text-blue-400" />;
    if (sortDir === 'desc') return <ArrowDown size={14} className="text-blue-400" />;
    return <ArrowUpDown size={14} className="text-gray-500" />;
  };

  const filteredAndSorted = useMemo(() => {
    let result = data.filter(a => {
      const q = search.toLowerCase();
      const matchesSearch = search === '' ||
        a.tag_number.toLowerCase().includes(q) ||
        a.species.toLowerCase().includes(q) ||
        a.breed.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'Все' || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    if (sortKey && sortDir) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        let cmp = 0;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          cmp = aVal - bVal;
        } else {
          cmp = String(aVal).localeCompare(String(bVal), 'ru');
        }
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [data, search, statusFilter, sortKey, sortDir]);

  const stats = useMemo(() => ({
    total: data.length,
    active: data.filter(a => a.status === 'Активное').length,
    treatment: data.filter(a => a.status === 'На лечении').length,
    observation: data.filter(a => a.status === 'Наблюдение').length,
  }), [data]);

  const handleAdd = () => {
    if (!newAnimal.tag_number.trim() || !newAnimal.breed.trim() || newAnimal.weight <= 0) {
      alert('Заполните номер бирки, породу и вес (вес > 0)');
      return;
    }
    if (newAnimal.weight < 40 || newAnimal.weight > 800) {
      alert('Вес должен быть в диапазоне 40–800 кг');
      return;
    }
    const nextId = data.length > 0 ? Math.max(...data.map(a => a.id)) + 1 : 1;
    setData([...data, { id: nextId, ...newAnimal }]);
    setNewAnimal({ tag_number: '', species: 'Корова', breed: '', weight: 0, status: 'Активное' });
    setShowAddModal(false);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-200 p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight">Реестр животных</h1>
        <p className="text-sm text-gray-400 mt-1">FarmIoT — управление фермерским хозяйством</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1e293b] border border-gray-700/50 rounded-lg px-5 py-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Всего</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-[#1e293b] border border-emerald-700/30 rounded-lg px-5 py-4">
          <p className="text-xs text-emerald-400 uppercase tracking-wider">Активные</p>
          <p className="text-2xl font-bold text-emerald-300 mt-1">{stats.active}</p>
        </div>
        <div className="bg-[#1e293b] border border-orange-700/30 rounded-lg px-5 py-4">
          <p className="text-xs text-orange-400 uppercase tracking-wider">На лечении</p>
          <p className="text-2xl font-bold text-orange-300 mt-1">{stats.treatment}</p>
        </div>
        <div className="bg-[#1e293b] border border-yellow-700/30 rounded-lg px-5 py-4">
          <p className="text-xs text-yellow-400 uppercase tracking-wider">Наблюдение</p>
          <p className="text-2xl font-bold text-yellow-300 mt-1">{stats.observation}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-[#1e293b] border border-gray-700/50 rounded-lg p-4 mb-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Поиск по животным…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0f172a] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
          />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="pl-9 pr-4 py-2.5 bg-[#0f172a] border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 appearance-none cursor-pointer min-w-[180px]"
          >
            <option value="Все">Все статусы</option>
            <option value="Активное">Активное</option>
            <option value="На лечении">На лечении</option>
            <option value="Наблюдение">Наблюдение</option>
          </select>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors shadow-lg shadow-blue-600/20"
        >
          <Plus size={18} />
          <span>Добавить животное</span>
        </button>
      </div>

      {/* Data grid */}
      <div className="bg-[#1e293b] border border-gray-700/50 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0f172a]/50 border-b border-gray-700/50">
              <tr>
                {SORTABLE_HEADERS.map((h) => (
                  <th
                    key={h.key}
                    onClick={() => handleSort(h.key)}
                    className="px-6 py-3.5 font-semibold text-gray-300 cursor-pointer select-none hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>{h.label}</span>
                      <SortIcon col={h.key} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.length > 0 ? (
                filteredAndSorted.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-gray-700/30 last:border-0 hover:bg-[#0f172a]/40 transition-colors"
                  >
                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">
                      <span className="bg-gray-700/40 px-2 py-1 rounded">#{String(a.id).padStart(3, '0')}</span>
                    </td>
                    <td className="px-6 py-4 text-white font-medium">{a.tag_number}</td>
                    <td className="px-6 py-4 text-gray-300">{a.species}</td>
                    <td className="px-6 py-4 text-gray-300">{a.breed}</td>
                    <td className="px-6 py-4 text-gray-200 font-mono">{a.weight}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[a.status]}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[a.status]}`} />
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={SORTABLE_HEADERS.length} className="px-6 py-12 text-center text-gray-500">
                    Нет данных по заданным фильтрам
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-gray-700/50 bg-[#0f172a]/30 flex items-center justify-between text-xs text-gray-400">
          <span>
            Показано <span className="text-gray-200 font-semibold">{filteredAndSorted.length}</span> из{' '}
            <span className="text-gray-200 font-semibold">{data.length}</span> записей
          </span>
          {statusFilter !== 'Все' && (
            <span className="text-blue-400">Фильтр: {statusFilter}</span>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] border border-gray-700 rounded-xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-5">Новое животное</h3>
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Номер бирки</label>
                <input
                  type="text"
                  placeholder="Например, A-017"
                  value={newAnimal.tag_number}
                  onChange={(e) => setNewAnimal({ ...newAnimal, tag_number: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Вид</label>
                <select
                  value={newAnimal.species}
                  onChange={(e) => setNewAnimal({ ...newAnimal, species: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option>Корова</option>
                  <option>Овца</option>
                  <option>Коза</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Порода</label>
                <input
                  type="text"
                  placeholder="Например, Голштинская"
                  value={newAnimal.breed}
                  onChange={(e) => setNewAnimal({ ...newAnimal, breed: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Вес (кг, 40–800)</label>
                <input
                  type="number"
                  min={40}
                  max={800}
                  value={newAnimal.weight || ''}
                  onChange={(e) => setNewAnimal({ ...newAnimal, weight: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Статус</label>
                <select
                  value={newAnimal.status}
                  onChange={(e) => setNewAnimal({ ...newAnimal, status: e.target.value as AnimalStatus })}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="Активное">Активное</option>
                  <option value="На лечении">На лечении</option>
                  <option value="Наблюдение">Наблюдение</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAdd}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors"
              >
                Сохранить
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-medium transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimalRegistry;
