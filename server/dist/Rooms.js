// server/dist/Rooms.js
import { NAMESPACES } from '../../lib/constants'; 
import { io } from '../server.js'; // 从 server.js 导入 io 对象
import winston from 'winston';

const logger = winston.createLogger({ // 确保已配置好 Winston logger
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'rooms-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// 添加客户端到房间
function addClientToRoom(clientId, roomName) {
  try {
    io.of(NAMESPACES.ROOMS).adapter.rooms.get(roomName)?.add(clientId); // 使用可选链
    logger.info(`Client ${clientId} added to room ${roomName}`);
  } catch (error) {
    logger.error(`Error adding client ${clientId} to room ${roomName}:`, error);
    throw new Error(`Failed to add client ${clientId} to room ${roomName}: ${error.message}`);
  }
}

// 创建房间
function createRoom(roomName) {
  try {
    if (io.of(NAMESPACES.ROOMS).adapter.rooms.has(roomName)) {
      throw new Error(`Room ${roomName} already exists`);
    }
    // Socket.IO 会自动创建房间，无需手动操作
    logger.info(`Room ${roomName} created`);
  } catch (error) {
    logger.error(`Error creating room ${roomName}:`, error);
    throw new Error(`Failed to create room ${roomName}: ${error.message}`);
  }
}

// 删除房间
function deleteRoom(roomName) {
  try {
    const room = io.of(NAMESPACES.ROOMS).adapter.rooms.get(roomName);
    if (!room) {
      throw new Error(`Room ${roomName} does not exist`);
    }

    // 将所有客户端移出房间
    for (const clientId of room) {
      removeClientFromRoom(clientId, roomName);
    }

    // Socket.IO 会自动删除空的房间，无需手动操作
    logger.info(`Room ${roomName} deleted`);
  } catch (error) {
    logger.error(`Error deleting room ${roomName}:`, error);
    throw new Error(`Failed to delete room ${roomName}: ${error.message}`);
  }
}

// 获取所有房间
function getAllRooms() {
  try {
    return Array.from(io.of(NAMESPACES.ROOMS).adapter.rooms.keys());
  } catch (error) {
    logger.error('Error getting all rooms:', error);
    throw new Error(`Failed to get all rooms: ${error.message}`);
  }
}

// 获取客户端所在的房间列表 (可选, 根据需要实现)
function getClientRooms(clientId) {
  try {
    const allRooms = io.of(NAMESPACES.ROOMS).adapter.rooms;
    const clientRooms = [];
    for (const [roomName, clientSet] of allRooms) {
      if (clientSet.has(clientId)) {
        clientRooms.push(roomName);
      }
    }
    return clientRooms;
  } catch (error) {
    logger.error(`Error getting rooms for client ${clientId}:`, error);
    throw new Error(`Failed to get rooms for client ${clientId}: ${error.message}`);
  }
}

//检查客户端是否在房间内
function isClientInRoom(clientId, roomName) {
  try {
    const room = io.of(NAMESPACES.ROOMS).adapter.rooms.get(roomName);
    return room ? room.has(clientId) : false;
  } catch (error) {
    logger.error(`Error checking if client ${clientId} is in room ${roomName}:`, error);
    throw new Error(`Failed to check if client ${clientId} is in room ${roomName}: ${error.message}`);
  }
}

// 将客户端从房间移除
function removeClientFromRoom(clientId, roomName) {
  try {
    io.of(NAMESPACES.ROOMS).adapter.rooms.get(roomName)?.delete(clientId); // 使用可选链
    logger.info(`Client ${clientId} removed from room ${roomName}`);
  } catch (error) {
    logger.error(`Error removing client ${clientId} from room ${roomName}:`, error);
    throw new Error(`Failed to remove client ${clientId} from room ${roomName}: ${error.message}`);
  }
}

export {
  addClientToRoom,
  createRoom,
  deleteRoom,
  getAllRooms,
  getClientRooms, // 可选
  isClientInRoom,
  removeClientFromRoom,
};