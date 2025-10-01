import React, { useState, useEffect } from "react";
import { Play, RotateCcw, Pause, SkipForward } from "lucide-react";

const AmbulancePathfinding = () => {
  // Graf kota - 20 node dengan koneksi
  const cityGraph = {
    A: {
      neighbors: [
        ["B", 4],
        ["C", 3],
        ["D", 5],
      ],
      x: 50,
      y: 200,
      name: "Lokasi Ambulans",
    },
    B: {
      neighbors: [
        ["A", 4],
        ["E", 6],
        ["F", 3],
      ],
      x: 120,
      y: 150,
      name: "Jl. Sudirman",
    },
    C: {
      neighbors: [
        ["A", 3],
        ["F", 4],
        ["G", 5],
      ],
      x: 120,
      y: 250,
      name: "Jl. Thamrin",
    },
    D: {
      neighbors: [
        ["A", 5],
        ["E", 3],
        ["H", 4],
      ],
      x: 120,
      y: 50,
      name: "Jl. Gatot Subroto",
    },
    E: {
      neighbors: [
        ["B", 6],
        ["D", 3],
        ["I", 5],
      ],
      x: 200,
      y: 100,
      name: "Jl. Rasuna Said",
    },
    F: {
      neighbors: [
        ["B", 3],
        ["C", 4],
        ["J", 6],
      ],
      x: 200,
      y: 200,
      name: "Jl. HR Rasuna",
    },
    G: {
      neighbors: [
        ["C", 5],
        ["J", 3],
        ["K", 4],
      ],
      x: 200,
      y: 300,
      name: "Jl. Kuningan",
    },
    H: {
      neighbors: [
        ["D", 4],
        ["I", 5],
        ["L", 3],
      ],
      x: 200,
      y: 30,
      name: "Jl. Casablanca",
    },
    I: {
      neighbors: [
        ["E", 5],
        ["H", 5],
        ["M", 4],
      ],
      x: 280,
      y: 80,
      name: "Jl. MT Haryono",
    },
    J: {
      neighbors: [
        ["F", 6],
        ["G", 3],
        ["N", 5],
      ],
      x: 280,
      y: 250,
      name: "Jl. Mampang",
    },
    K: {
      neighbors: [
        ["G", 4],
        ["N", 6],
        ["O", 5],
      ],
      x: 280,
      y: 350,
      name: "Jl. Pancoran",
    },
    L: {
      neighbors: [
        ["H", 3],
        ["M", 4],
        ["P", 6],
      ],
      x: 280,
      y: 20,
      name: "Jl. Cikini",
    },
    M: {
      neighbors: [
        ["I", 4],
        ["L", 4],
        ["P", 3],
        ["Q", 5],
      ],
      x: 330,
      y: 120,
      name: "Jl. Salemba",
    },
    N: {
      neighbors: [
        ["J", 5],
        ["K", 6],
        ["R", 4],
      ],
      x: 360,
      y: 280,
      name: "Jl. Tebet",
    },
    O: {
      neighbors: [
        ["K", 5],
        ["R", 3],
        ["S", 6],
      ],
      x: 360,
      y: 370,
      name: "Jl. Pasar Minggu",
    },
    P: {
      neighbors: [
        ["L", 6],
        ["M", 3],
        ["Q", 4],
        ["S", 7],
        ["T", 5],
      ],
      x: 400,
      y: 80,
      name: "Jl. Matraman",
    },
    Q: {
      neighbors: [
        ["M", 5],
        ["P", 4],
        ["T", 3],
      ],
      x: 420,
      y: 160,
      name: "Jl. Cawang",
    },
    R: {
      neighbors: [
        ["N", 4],
        ["O", 3],
        ["S", 5],
      ],
      x: 430,
      y: 320,
      name: "Jl. Ragunan",
    },
    S: {
      neighbors: [
        ["O", 6],
        ["P", 7],
        ["R", 5],
        ["T", 4],
      ],
      x: 450,
      y: 240,
      name: "Jl. Kalibata",
    },
    T: {
      neighbors: [
        ["P", 5],
        ["Q", 3],
        ["S", 4],
      ],
      x: 480,
      y: 200,
      name: "Rumah Sakit",
    },
  };

  const [openList, setOpenList] = useState([]);
  const [visitedList, setVisitedList] = useState([]);
  const [currentNode, setCurrentNode] = useState(null);
  const [currentNeighbors, setCurrentNeighbors] = useState([]);
  const [path, setPath] = useState([]);
  const [parentMap, setParentMap] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [stepLog, setStepLog] = useState([]);
  const [stats, setStats] = useState({ nodesExpanded: 0, totalDistance: 0 });
  const [startNode, setStartNode] = useState("A");
  const [goalNode, setGoalNode] = useState("T");

  // Fungsi heuristik - Jarak Euclidean
  const heuristic = (node, goal = null) => {
    const targetGoal = goal || goalNode;
    const n = cityGraph[node];
    const g = cityGraph[targetGoal];
    const dx = n.x - g.x;
    const dy = n.y - g.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Reset algoritma
  const reset = () => {
    setOpenList([{ node: startNode, h: heuristic(startNode), g: 0 }]);
    setVisitedList([]);
    setCurrentNode(null);
    setCurrentNeighbors([]);
    setPath([]);
    setParentMap({});
    setIsRunning(false);
    setIsComplete(false);
    setStepLog([
      `Greedy-Best First Search dimulai. Node ${startNode} (${cityGraph[startNode].name}) sebagai start node ditambahkan ke open list.`,
    ]);
    setStats({ nodesExpanded: 0, totalDistance: 0 });
  };

  // Rekonstruksi path
  const reconstructPath = (parents, goal) => {
    const pathNodes = [];
    let current = goal;
    let totalDist = 0;

    while (current) {
      pathNodes.unshift(current);
      if (parents[current]) {
        const parent = parents[current];
        const edge = cityGraph[parent].neighbors.find((n) => n[0] === current);
        if (edge) totalDist += edge[1];
        current = parent;
      } else {
        break;
      }
    }

    return { pathNodes, totalDist };
  };

  // Satu langkah GBFS
  const step = () => {
    if (openList.length === 0) {
      setStepLog((prev) => [
        ...prev,
        "❌ GAGAL: Open list kosong, tidak ada solusi!",
      ]);
      setIsRunning(false);
      setIsComplete(true);
      return;
    }

    // Sort by h(n) - greedy!
    const sorted = [...openList].sort((a, b) => a.h - b.h);
    const current = sorted[0];
    const remaining = sorted.slice(1);

    setCurrentNode(current.node);
    setOpenList(remaining);
    setVisitedList((prev) => [...prev, current.node]);

    setStepLog((prev) => [
      ...prev,
      `🔍 Ekspansi: ${current.node} (${
        cityGraph[current.node].name
      }) - h(n) = ${current.h.toFixed(2)}`,
    ]);

    // Goal test
    if (current.node === goalNode) {
      const { pathNodes, totalDist } = reconstructPath(parentMap, goalNode);
      setPath(pathNodes);
      setCurrentNeighbors([]);
      setStats((prev) => ({ ...prev, totalDistance: totalDist }));
      setStepLog((prev) => [
        ...prev,
        `✅ GOAL DITEMUKAN!`,
        `📍 Path: ${pathNodes.join(" → ")}`,
        `📏 Total Jarak: ${totalDist.toFixed(2)} km`,
      ]);
      setIsRunning(false);
      setIsComplete(true);
      return;
    }

    // Ekspansi neighbors
    const newParentMap = { ...parentMap };
    const newOpenList = [...remaining];
    const newNeighbors = [];
    let expanded = 0;

    cityGraph[current.node].neighbors.forEach(([neighbor, distance]) => {
      if (
        !visitedList.includes(neighbor) &&
        !sorted.some((n) => n.node === neighbor)
      ) {
        const h = heuristic(neighbor);
        newOpenList.push({ node: neighbor, h, g: current.g + distance });
        newParentMap[neighbor] = current.node;
        newNeighbors.push(neighbor);
        expanded++;
      }
    });

    setParentMap(newParentMap);
    setOpenList(newOpenList);
    setCurrentNeighbors(newNeighbors);
    setStats((prev) => ({ nodesExpanded: prev.nodesExpanded + 1 }));

    if (expanded > 0) {
      setStepLog((prev) => [
        ...prev,
        `  ➕ Menambahkan ${expanded} tetangga ke open list: ${newNeighbors.join(
          ", "
        )}`,
      ]);
    }
  };

  // Auto-run
  useEffect(() => {
    if (isRunning && !isComplete) {
      const timer = setTimeout(step, 1000);
      return () => clearTimeout(timer);
    }
  }, [isRunning, isComplete, openList, visitedList]);

  // Inisialisasi
  useEffect(() => {
    reset();
  }, [startNode, goalNode]);

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Penjelasan Heuristik */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-xl p-6 mb-6 text-white">
        <h2 className="text-2xl font-bold mb-4">
          📐 Fungsi Heuristik - Jarak Euclidean
        </h2>

        <div className="bg-white/10 rounded-lg p-4 mb-4 backdrop-blur">
          <div className="text-lg font-mono mb-2">
            h(n) = √[(x_n - x_goal)² + (y_n - y_goal)²]
          </div>
          <p className="text-sm opacity-90">
            Menghitung jarak garis lurus (straight-line distance) dari node n ke
            goal
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
            <h3 className="font-bold mb-2">📥 INPUT:</h3>
            <ul className="text-sm space-y-1">
              <li>
                • <span className="font-semibold">node</span>: ID node saat ini
                (contoh: 'A', 'M', 'S')
              </li>
              <li>
                • <span className="font-semibold">goalNode</span>: ID tujuan
                (default: 'T' - Rumah Sakit)
              </li>
              <li>
                • <span className="font-semibold">cityGraph</span>: Data
                koordinat (x, y) semua node
              </li>
            </ul>
          </div>

          <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
            <h3 className="font-bold mb-2">📤 OUTPUT:</h3>
            <ul className="text-sm space-y-1">
              <li>
                • <span className="font-semibold">Float number</span>: Estimasi
                jarak ke goal
              </li>
              <li>
                • <span className="font-semibold">Range</span>: [0, ~430] dalam
                graf ini
              </li>
              <li>
                • <span className="font-semibold">Sifat</span>: Semakin kecil =
                semakin dekat ke goal
              </li>
              <li>
                • <span className="font-semibold">h(T)</span>: Selalu = 0 (sudah
                di goal)
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-yellow-400/20 border border-yellow-300/50 rounded-lg p-4 mt-4">
          <h3 className="font-bold mb-2">💡 Kenapa Euclidean?</h3>
          <p className="text-sm">
            Jarak Euclidean memberikan estimasi "jarak burung terbang" yang
            cepat dihitung (O(1)) dan memberikan panduan arah yang baik untuk
            GBFS. Tidak harus akurat (admissible), yang penting informatif untuk
            memilih node yang "terlihat" paling dekat.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          🚑 Sistem Navigasi Ambulans
        </h1>
        <p className="text-gray-600 mb-4">
          Implementasi Greedy Best-First Search
        </p>

        {/* Node Selection */}
        <div className="grid md:grid-cols-2 gap-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🚩 Start Node (Initial State)
            </label>
            <select
              value={startNode}
              onChange={(e) => setStartNode(e.target.value)}
              disabled={isRunning || isComplete}
              className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
              {Object.keys(cityGraph).map((nodeId) => (
                <option
                  key={nodeId}
                  value={nodeId}
                  disabled={nodeId === goalNode}
                >
                  {nodeId} - {cityGraph[nodeId].name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🎯 Goal Node (Goal State)
            </label>
            <select
              value={goalNode}
              onChange={(e) => setGoalNode(e.target.value)}
              disabled={isRunning || isComplete}
              className="w-full px-4 py-2 border-2 border-red-300 rounded-lg focus:outline-none focus:border-red-500 disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
              {Object.keys(cityGraph).map((nodeId) => (
                <option
                  key={nodeId}
                  value={nodeId}
                  disabled={nodeId === startNode}
                >
                  {nodeId} - {cityGraph[nodeId].name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setIsRunning(!isRunning)}
            disabled={isComplete}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning ? <Pause size={20} /> : <Play size={20} />}
            {isRunning ? "Pause" : "Start"}
          </button>

          <button
            onClick={step}
            disabled={isRunning || isComplete}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <SkipForward size={20} />
            Step
          </button>

          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RotateCcw size={20} />
            Reset
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-100 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Nodes Diekspansi</div>
            <div className="text-2xl font-bold text-blue-700">
              {stats.nodesExpanded}
            </div>
          </div>
          <div className="bg-green-100 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Ukuran Open List</div>
            <div className="text-2xl font-bold text-green-700">
              {openList.length}
            </div>
          </div>
          <div className="bg-purple-100 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Nodes Dikunjungi</div>
            <div className="text-2xl font-bold text-purple-700">
              {visitedList.length}
            </div>
          </div>
        </div>

        {/* Visualization */}
        <div
          className="bg-gray-50 rounded-lg p-4 mb-6 relative"
          style={{ height: "450px" }}
        >
          <svg width="100%" height="100%" viewBox="0 0 530 400">
            {/* Edges */}
            {Object.entries(cityGraph).map(([nodeId, nodeData]) =>
              nodeData.neighbors.map(([neighborId, distance]) => {
                const neighbor = cityGraph[neighborId];
                const isInPath =
                  path.length > 0 &&
                  path.includes(nodeId) &&
                  path.includes(neighborId) &&
                  Math.abs(path.indexOf(nodeId) - path.indexOf(neighborId)) ===
                    1;

                return (
                  <line
                    key={`${nodeId}-${neighborId}`}
                    x1={nodeData.x}
                    y1={nodeData.y}
                    x2={neighbor.x}
                    y2={neighbor.y}
                    stroke={isInPath ? "#10b981" : "#d1d5db"}
                    strokeWidth={isInPath ? 4 : 2}
                    opacity={0.6}
                  />
                );
              })
            )}

            {/* Nodes */}
            {Object.entries(cityGraph).map(([nodeId, nodeData]) => {
              //   const isStart = nodeId === "A";
              const isStart = nodeId === startNode;
              //   const isGoal = nodeId === "T";
              const isGoal = nodeId === goalNode;
              const isCurrent = currentNode === nodeId;
              const isVisited = visitedList.includes(nodeId);
              const isCurrentNeighbor = currentNeighbors.includes(nodeId);
              const isInPath = path.includes(nodeId);

              let fillColor = "#9ca3af"; // default gray
              if (isStart) fillColor = "#3b82f6"; // blue
              else if (isGoal) fillColor = "#ef4444"; // red
              else if (isCurrent) fillColor = "#f59e0b"; // orange
              else if (isInPath) fillColor = "#10b981"; // green
              else if (isCurrentNeighbor)
                fillColor = "#8b5cf6"; // purple - HANYA tetangga baru
              else if (isVisited) fillColor = "#00bcd4"; // cyan

              return (
                <g key={nodeId}>
                  <circle
                    cx={nodeData.x}
                    cy={nodeData.y}
                    r={isCurrent ? 18 : 14}
                    fill={fillColor}
                    stroke={isCurrent ? "#fbbf24" : "#fff"}
                    strokeWidth={isCurrent ? 4 : 2}
                  />
                  <text
                    x={nodeData.x}
                    y={nodeData.y + 5}
                    textAnchor="middle"
                    fill="white"
                    fontSize="14"
                    fontWeight="bold"
                  >
                    {nodeId}
                    {/* {nodeId == goalNode ? "🏥" : nodeId == startNode ? "🚑" : nodeId} */}
                  </text>
                  <text
                    x={nodeData.x}
                    y={nodeData.y + 32}
                    textAnchor="middle"
                    fill="#374151"
                    fontSize="10"
                  >
                    h={heuristic(nodeId).toFixed(0)}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-md text-sm">
            <div className="font-semibold mb-2">Keterangan:</div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 rounded-full bg-blue-600"></div>
              <span>Start</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 rounded-full bg-red-600"></div>
              <span>Goal</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span>Node saat ini</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 rounded-full bg-purple-600"></div>
              <span>Tetangga Baru</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 rounded-full bg-cyan-500"></div>
              <span>Dikunjungi</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-600"></div>
              <span>Jalur</span>
            </div>
          </div>
        </div>

        {/* Log */}
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
          {stepLog.map((log, idx) => (
            <div key={idx} className="mb-1">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AmbulancePathfinding;
