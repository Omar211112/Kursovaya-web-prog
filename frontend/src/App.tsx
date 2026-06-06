import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  LayoutDashboard, PawPrint, Sprout, Calendar, Wallet,
  Activity, Map as MapIcon, ClipboardList, Calculator, Trash2, ListChecks
} from 'lucide-react';
import AnimalRegistry from './components/AnimalRegistry';

const API_BASE = "http://localhost:8000";
const YANDEX_MAPS_API_KEY = "1d49a90d-c361-479c-8d52-3bc659fa6d0b";

interface Sensor {
  sensor_type: string;
  value?: number;
  latitude?: number;
  longitude?: number;
  device_id: string;
}

interface Animal {
  id: number;
  name: string;
  species: string;
  breed: string;
  birth_date: string;
  status: string;
}

interface Crop {
  id: number;
  name: string;
  area: number;
  planting_date: string;
  expected_harvest_date: string;
  status: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  planned_date: string;
  is_completed: number;
}

interface VetRecord {
  id: number;
  animal_id: number;
  record_date: string;
  description: string;
  treatment: string;
  cost: number;
}

interface FinanceRecord {
  id: number;
  category: string;
  amount: number;
  is_income: number;
  record_date: string;
  description: string;
}

interface Calculation {
  id: number;
  item_type: string;
  target_id: number;
  quantity: number;
  unit: string;
  calculation_date: string;
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [finance, setFinance] = useState<FinanceRecord[]>([]);
  const [vet, setVet] = useState<VetRecord[]>([]);
  const [calcs, setCalcs] = useState<Calculation[]>([]);
  const [showAddModal, setShowAddModal] = useState<string | false>(false);
  const [formData, setFormData] = useState<any>({});
  const mapRef = useRef<HTMLDivElement>(null);
  const yandexMapInitializedRef = useRef(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedTemp, setSelectedTemp] = useState<number | null>(null);
  const [selectedHum, setSelectedHum] = useState<number | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchSensors();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard' && mapRef.current && !yandexMapInitializedRef.current) {
      initYandexMap();
    }
  }, [activeTab, sensors]);

  const findNearestSensors = (lat: number, lng: number) => {
    let nearestTemp: any = null;
    let nearestHum: any = null;
    let minDistTemp = Infinity;
    let minDistHum = Infinity;
    sensors.forEach(s => {
      if (!s.latitude || !s.longitude) return;
      const dist = Math.sqrt(
        Math.pow(s.latitude - lat, 2) + Math.pow(s.longitude - lng, 2)
      );
      if (s.sensor_type === 'temperature' && dist < minDistTemp && s.value !== undefined) {
        minDistTemp = dist;
        nearestTemp = s;
      }
      if (s.sensor_type === 'humidity' && dist < minDistHum && s.value !== undefined) {
        minDistHum = dist;
        nearestHum = s;
      }
    });
    return { nearestTemp, nearestHum };
  };

  const initYandexMap = () => {
    if (yandexMapInitializedRef.current || !mapRef.current) return;

    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_MAPS_API_KEY}&lang=ru_RU`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      if (!window.ymaps || !mapRef.current) return;
      window.ymaps.ready(() => {
        try {
          const gpsData = sensors.filter(s => s.sensor_type === 'gps');
          const centerLat = gpsData.length > 0 ? (gpsData[0].latitude || 55.7558) : 55.7558;
          const centerLng = gpsData.length > 0 ? (gpsData[0].longitude || 37.6173) : 37.6173;

          if (!mapRef.current) return;
          mapRef.current.innerHTML = '';
          const map = new window.ymaps.Map(mapRef.current, {
            center: [centerLat, centerLng],
            zoom: 13,
            controls: ['zoomControl', 'fullscreenControl', 'geolocationControl']
          });

          yandexMapInitializedRef.current = true;

          // Маркеры GPS устройств
          gpsData.forEach((pos) => {
            if (pos.latitude && pos.longitude) {
              const placemark = new window.ymaps.Placemark(
                [pos.latitude, pos.longitude],
                {
                  hintContent: `Устройство: ${pos.device_id}`,
                  balloonContent: `<div style="font-family:Arial;font-size:12px;">
                    <strong>Устройство:</strong> ${pos.device_id}<br/>
                    <strong>Широта:</strong> ${pos.latitude.toFixed(4)}<br/>
                    <strong>Долгота:</strong> ${pos.longitude.toFixed(4)}</div>`
                },
                { preset: 'islands#greenDotIcon' }
              );
              map.geoObjects.add(placemark);
            }
          });

          // Температурные маркеры
          const tempSensors = sensors.filter(s => s.sensor_type === 'temperature' && s.latitude && s.longitude && s.value !== undefined);
          tempSensors.forEach((s) => {
            const color = s.value! > 30 ? '#ef4444' : s.value! > 20 ? '#f97316' : s.value! > 10 ? '#eab308' : '#3b82f6';
            const pm = new window.ymaps.Placemark(
              [s.latitude!, s.longitude!],
              { hintContent: `${s.value}°C`, balloonContent: `<div style="font-family:Arial;font-size:13px;min-width:160px;">
                <p style="margin:4px 0;font-weight:bold;">🌡️ Температура: <span style="color:${color}">${s.value}°C</span></p>
                <p style="margin:4px 0;color:#666;">Устройство: ${s.device_id}</p></div>` },
              { preset: 'islands#circleIcon', iconColor: color }
            );
            map.geoObjects.add(pm);
          });

          // Влажность
          const humSensors = sensors.filter(s => s.sensor_type === 'humidity' && s.latitude && s.longitude && s.value !== undefined);
          humSensors.forEach((s) => {
            const color = s.value! > 70 ? '#3b82f6' : s.value! > 40 ? '#06b6d4' : '#d97706';
            const pm = new window.ymaps.Placemark(
              [s.latitude!, s.longitude!],
              { hintContent: `${s.value}% влажность`, balloonContent: `<div style="font-family:Arial;font-size:13px;min-width:160px;">
                <p style="margin:4px 0;font-weight:bold;">💧 Влажность почвы: <span style="color:${color}">${s.value}%</span></p>
                <p style="margin:4px 0;color:#666;">Устройство: ${s.device_id}</p></div>` },
              { preset: 'islands#circleDotIcon', iconColor: color }
            );
            map.geoObjects.add(pm);
          });

          // Перетаскиваемый маркер
          const draggableMarker = new window.ymaps.Placemark(
            [centerLat, centerLng],
            { hintContent: 'Перетащите, чтобы выбрать место' },
            { preset: 'islands#redDotIcon', draggable: true }
          );
          map.geoObjects.add(draggableMarker);

          const updateSelectedLocation = (lat: number, lng: number) => {
            setSelectedCoords({ lat, lng });
            const { nearestTemp, nearestHum } = findNearestSensors(lat, lng);
            setSelectedTemp(nearestTemp?.value ?? null);
            setSelectedHum(nearestHum?.value ?? null);
            setSelectedDeviceId(nearestTemp?.device_id || nearestHum?.device_id || null);
          };

          draggableMarker.events.add('dragend', () => {
            try {
              const coords = draggableMarker.geometry.getCoordinates();
              updateSelectedLocation(coords[0], coords[1]);
            } catch (err) { /* ignore */ }
          });

          map.events.add('click', (e: any) => {
            try {
              const coords = e.get('coords');
              draggableMarker.geometry.setCoordinates(coords);
              updateSelectedLocation(coords[0], coords[1]);
            } catch (err) { /* ignore */ }
          });

          // Перехватываем нажатие на кнопку геолокации — центрируем карту
          map.controls.get('geolocationControl')?.events.add('locationchange', (e: any) => {
            const pos = e.get('position');
            if (pos) {
              map.panTo([pos.latitude, pos.longitude], { flying: true });
            }
          });

          // Автоматическая геолокация при загрузке — центрируем карту на пользователе
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const { latitude: userLat, longitude: userLng } = position.coords;
                map.setCenter([userLat, userLng], 15);
                const userPm = new window.ymaps.Placemark(
                  [userLat, userLng],
                  { hintContent: 'Вы здесь', balloonContent: `<div style="font-family:Arial;font-size:13px;">
                    <p style="margin:4px 0;font-weight:bold;">📍 Ваше местоположение</p>
                    <p style="margin:4px 0;color:#555;">Широта: ${userLat.toFixed(4)}</p>
                    <p style="margin:4px 0;color:#555;">Долгота: ${userLng.toFixed(4)}</p></div>` },
                  { preset: 'islands#blueCircleDotIconWithCaption', iconCaption: 'Вы здесь' }
                );
                map.geoObjects.add(userPm);
                draggableMarker.geometry.setCoordinates([userLat, userLng]);
                updateSelectedLocation(userLat, userLng);
              },
              () => {},
              { enableHighAccuracy: true, timeout: 10000 }
            );
          }
        } catch (e) {
          console.error('Ошибка инициализации карты:', e);
          yandexMapInitializedRef.current = false;
        }
      });
    };
    script.onerror = () => {
      console.error('Ошибка загрузки Яндекс.Карт. Проверьте API-ключ.');
      if (mapRef.current) {
        mapRef.current.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#999;">
          Ошибка загрузки карты. Проверьте API-ключ.</div>`;
      }
    };
    document.head.appendChild(script);
  };

  const fetchSensors = async () => {
    try {
      const res = await axios.get(`${API_BASE}/sensors`);
      setSensors(res.data);
    } catch (e) {
      console.error('Ошибка при загрузке данных датчиков:', e);
    }
  };

  const fetchData = async () => {
    try {
      const [a, c, t, f, v, cl] = await Promise.all([
        axios.get(`${API_BASE}/animals`),
        axios.get(`${API_BASE}/crops`),
        axios.get(`${API_BASE}/tasks`),
        axios.get(`${API_BASE}/finance`),
        axios.get(`${API_BASE}/vet`),
        axios.get(`${API_BASE}/calculations`)
      ]);
      setAnimals(a.data);
      setCrops(c.data);
      setTasks(t.data);
      setFinance(f.data);
      setVet(v.data);
      setCalcs(cl.data);
    } catch (e) {
      console.error('Ошибка при загрузке данных:', e);
    }
  };

  const handleAddRecord = async (endpoint: string) => {
    try {
      if (Object.keys(formData).length === 0) {
        alert('Пожалуйста, заполните поля формы');
        return;
      }
      await axios.post(`${API_BASE}/${endpoint}`, formData);
      setFormData({});
      setShowAddModal(false);
      fetchData();
    } catch (e) {
      alert('Ошибка при добавлении записи');
    }
  };

  const handleDelete = async (endpoint: string, id: number) => {
    try {
      await axios.delete(`${API_BASE}/${endpoint}/${id}`);
      fetchData();
    } catch (e) {
      alert('Ошибка при удалении записи');
    }
  };

  const renderDashboard = () => {
    const lastTemp = sensors.find(s => s.sensor_type === 'temperature')?.value;
    const lastHum = sensors.find(s => s.sensor_type === 'humidity')?.value;
    const gpsData = sensors.filter(s => s.sensor_type === 'gps').slice(0, 1);

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Панель управления</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500 font-medium">
                <span className="block">Температура</span>
                <span className="block text-xs text-gray-400 font-normal mt-0.5">последние показания датчика</span>
              </span>
              <Activity className="text-orange-500" />
            </div>
            <div className="text-3xl font-bold">{lastTemp ? `${lastTemp}°C` : '--'}</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500 font-medium">
                <span className="block">Влажность почвы</span>
                <span className="block text-xs text-gray-400 font-normal mt-0.5">последние показания датчика</span>
              </span>
              <Activity className="text-blue-500" />
            </div>
            <div className="text-3xl font-bold">{lastHum ? `${lastHum}%` : '--'}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h3 className="text-lg font-bold mb-4 flex items-center"><MapIcon className="mr-2" size={20} /> Местоположение фермы</h3>

          {selectedCoords && (
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">📍 Выбранные координаты</p>
                <p className="text-sm font-semibold">
                  {selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">🌡️ Температура рядом</p>
                <p className="text-lg font-bold" style={{ color: selectedTemp !== null ? (selectedTemp > 30 ? '#ef4444' : selectedTemp > 20 ? '#f97316' : selectedTemp > 10 ? '#eab308' : '#3b82f6') : '#999' }}>
                  {selectedTemp !== null ? `${selectedTemp}°C` : 'Нет данных'}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">💧 Влажность почвы рядом</p>
                <p className="text-lg font-bold" style={{ color: selectedHum !== null ? (selectedHum > 70 ? '#3b82f6' : selectedHum > 40 ? '#06b6d4' : '#d97706') : '#999' }}>
                  {selectedHum !== null ? `${selectedHum}%` : 'Нет данных'}
                </p>
              </div>
            </div>
          )}

          {!selectedCoords && (
            <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-sm text-blue-900">
                👆 Кликните по карте или перетащите красный маркер, чтобы увидеть данные датчиков в этой точке
              </p>
            </div>
          )}

          {gpsData.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-sm text-blue-900">
                📍 Координаты фермы: {gpsData[0].latitude?.toFixed(4)}, {gpsData[0].longitude?.toFixed(4)}
              </p>
            </div>
          )}
          <div className="relative">
            <button
              onClick={() => {
                if (!navigator.geolocation || !yandexMapInitializedRef.current) return;
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    // Перемещаем карту и маркер
                    setSelectedCoords({ lat, lng });
                    const { nearestTemp, nearestHum } = findNearestSensors(lat, lng);
                    setSelectedTemp(nearestTemp?.value ?? null);
                    setSelectedHum(nearestHum?.value ?? null);
                    setSelectedDeviceId(nearestTemp?.device_id || nearestHum?.device_id || null);
                  },
                  (err) => alert('Не удалось определить местоположение: ' + err.message),
                  { enableHighAccuracy: true, timeout: 10000 }
                );
              }}
              className="mb-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              📍 Показать моё местоположение
            </button>
            <div className="h-[400px] rounded-lg overflow-hidden border bg-gray-200" ref={mapRef}>
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                Загрузка карты Yandex...
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderModule = (title: string, data: any[], columns: string[], icon: any, endpoint: string) => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center">{icon} <span className="ml-2">{title}</span></h2>
        <button onClick={() => { setFormData({}); setShowAddModal(endpoint); }} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">Добавить</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              {columns.map(col => <th key={col} className="p-4 font-semibold text-gray-600">{col}</th>)}
              <th className="p-4 font-semibold text-gray-600 w-20">Действия</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? data.map((item, idx) => (
              <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                {Object.keys(item).filter(k => k !== 'id').map(k => <td key={k} className="p-4 text-gray-700">{String(item[k]).substring(0, 50)}</td>)}
                <td className="p-4">
                  <button onClick={() => handleDelete(endpoint, item.id)} className="text-red-500 hover:text-red-700 transition-colors" title="Удалить">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            )) : <tr><td colSpan={columns.length + 1} className="p-8 text-center text-gray-400">Нет данных</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <div className="w-64 bg-white border-r border-gray-200">
        <div className="p-6 border-b"><h1 className="text-xl font-bold text-green-700 flex items-center"><Sprout className="mr-2" /> FarmIoT</h1></div>
        <nav className="p-4 space-y-2">
          <NavItem icon={<LayoutDashboard size={20}/>} label="Панель управления" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<PawPrint size={20}/>} label="Учет поголовья" active={activeTab === 'animals'} onClick={() => setActiveTab('animals')} />
          <NavItem icon={<ListChecks size={20}/>} label="Реестр животных" active={activeTab === 'registry'} onClick={() => setActiveTab('registry')} />
          <NavItem icon={<Sprout size={20}/>} label="Учет посевов" active={activeTab === 'crops'} onClick={() => setActiveTab('crops')} />
          <NavItem icon={<ClipboardList size={20}/>} label="Ветеринарный учет" active={activeTab === 'vet'} onClick={() => setActiveTab('vet')} />
          <NavItem icon={<Calendar size={20}/>} label="Планирование работ" active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
          <NavItem icon={<Calculator size={20}/>} label="Расчеты" active={activeTab === 'calcs'} onClick={() => setActiveTab('calcs')} />
          <NavItem icon={<Wallet size={20}/>} label="Финансы" active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} />
        </nav>
      </div>
      <div className="flex-1">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'registry' && <AnimalRegistry />}
        {activeTab === 'animals' && renderModule('Учет поголовья', animals, ['Кличка', 'Вид', 'Порода', 'Дата рождения', 'Статус'], <PawPrint/>, 'animals')}
        {activeTab === 'crops' && renderModule('Учет посевов', crops, ['Название', 'Площадь (га)', 'Дата посадки', 'Дата сбора', 'Статус'], <Sprout/>, 'crops')}
        {activeTab === 'vet' && renderModule('Ветеринарный учет', vet, ['ID животного', 'Дата', 'Описание', 'Лечение', 'Стоимость'], <ClipboardList/>, 'vet')}
        {activeTab === 'tasks' && renderModule('Планирование работ', tasks, ['Задача', 'Описание', 'Дата', 'Выполнено'], <Calendar/>, 'tasks')}
        {activeTab === 'calcs' && renderModule('Расчет кормов и удобрений', calcs, ['Тип', 'ID объекта', 'Количество', 'Единица измерения', 'Дата'], <Calculator/>, 'calculations')}
        {activeTab === 'finance' && renderModule('Финансы', finance, ['Категория', 'Сумма', 'Доход/Расход', 'Дата', 'Описание'], <Wallet/>, 'finance')}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Добавить запись</h3>
            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {showAddModal === 'animals' && (
                <>
                  <input type="text" placeholder="Кличка" onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded" />
                  <input type="text" placeholder="Вид" onChange={(e) => setFormData({...formData, species: e.target.value})} className="w-full p-2 border rounded" />
                  <input type="text" placeholder="Порода" onChange={(e) => setFormData({...formData, breed: e.target.value})} className="w-full p-2 border rounded" />
                  <input type="date" onChange={(e) => setFormData({...formData, birth_date: e.target.value})} className="w-full p-2 border rounded" />
                  <input type="text" placeholder="Статус" onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full p-2 border rounded" />
                </>
              )}
              {showAddModal === 'crops' && (
                <>
                  <input type="text" placeholder="Название растения" onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded" />
                  <input type="number" placeholder="Площадь (га)" onChange={(e) => setFormData({...formData, area: e.target.value})} className="w-full p-2 border rounded" />
                  <input type="date" onChange={(e) => setFormData({...formData, planting_date: e.target.value})} className="w-full p-2 border rounded" />
                  <input type="date" onChange={(e) => setFormData({...formData, expected_harvest_date: e.target.value})} className="w-full p-2 border rounded" />
                  <input type="text" placeholder="Статус" onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full p-2 border rounded" />
                </>
              )}
              {showAddModal === 'tasks' && (
                <>
                  <input type="text" placeholder="Задача" onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full p-2 border rounded" />
                  <input type="text" placeholder="Описание" onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full p-2 border rounded" />
                  <input type="date" onChange={(e) => setFormData({...formData, planned_date: e.target.value})} className="w-full p-2 border rounded" />
                </>
              )}
              {showAddModal === 'vet' && (
                <>
                  <select onChange={(e) => setFormData({...formData, animal_id: Number(e.target.value)})} className="w-full p-2 border rounded" defaultValue="">
                    <option value="" disabled>Выберите животное</option>
                    {animals.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.species}, {a.breed || 'порода не указана'})</option>
                    ))}
                  </select>
                  <input type="date" onChange={(e) => setFormData({...formData, record_date: e.target.value})} className="w-full p-2 border rounded" />
                  <input type="text" placeholder="Описание" onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full p-2 border rounded" />
                  <input type="text" placeholder="Лечение" onChange={(e) => setFormData({...formData, treatment: e.target.value})} className="w-full p-2 border rounded" />
                  <input type="number" placeholder="Стоимость" onChange={(e) => setFormData({...formData, cost: e.target.value})} className="w-full p-2 border rounded" />
                </>
              )}
              {showAddModal === 'finance' && (
                <>
                  <input type="text" placeholder="Категория" onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full p-2 border rounded" />
                  <input type="number" placeholder="Сумма" onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full p-2 border rounded" />
                  <select onChange={(e) => setFormData({...formData, is_income: e.target.value === 'income' ? 1 : 0})} className="w-full p-2 border rounded">
                    <option>Выберите тип</option>
                    <option value="income">Доход</option>
                    <option value="expense">Расход</option>
                  </select>
                  <input type="date" onChange={(e) => setFormData({...formData, record_date: e.target.value})} className="w-full p-2 border rounded" />
                  <input type="text" placeholder="Описание" onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full p-2 border rounded" />
                </>
              )}
              {showAddModal === 'calculations' && (
                <>
                  <input type="text" placeholder="Тип (Корм/Удобрение)" onChange={(e) => setFormData({...formData, item_type: e.target.value})} className="w-full p-2 border rounded" />
                  <input type="number" placeholder="ID объекта" onChange={(e) => setFormData({...formData, target_id: e.target.value})} className="w-full p-2 border rounded" />
                  <input type="number" placeholder="Количество" onChange={(e) => setFormData({...formData, quantity: e.target.value})} className="w-full p-2 border rounded" />
                  <input type="text" placeholder="Единица измерения" onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-full p-2 border rounded" />
                </>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleAddRecord(showAddModal)} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">Сохранить</button>
              <button onClick={() => setShowAddModal(false)} className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500">Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${active ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}>
      {icon}<span>{label}</span>
    </button>
  );
}

declare global {
  interface Window {
    ymaps: any;
  }
}

export default App;