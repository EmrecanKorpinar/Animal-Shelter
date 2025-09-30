const { redisClient } = require('../config');

// Cache invalidation helper
const invalidateCache = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`Invalidated cache keys: ${keys.join(', ')}`);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
};

// Notification channels
const CHANNELS = {
  ANIMAL_UPDATED: 'animal:updated',
  ADOPTION_APPROVED: 'adoption:approved',
  ADOPTION_REJECTED: 'adoption:rejected',
  ANIMAL_ADOPTED: 'animal:adopted'
};

// Publisher functions
const publishAnimalUpdated = async (animalId, animalData) => {
  try {
    const message = {
      animalId,
      animalData,
      timestamp: new Date().toISOString()
    };
    await redisClient.publish(CHANNELS.ANIMAL_UPDATED, JSON.stringify(message));
    console.log(`Published animal update for ID: ${animalId}`);
  } catch (error) {
    console.error('Error publishing animal update:', error);
  }
};

const publishAdoptionApproved = async (adoptionRequestId, userId, animalId) => {
  try {
    const message = {
      adoptionRequestId,
      userId,
      animalId,
      timestamp: new Date().toISOString()
    };
    await redisClient.publish(CHANNELS.ADOPTION_APPROVED, JSON.stringify(message));
    console.log(`Published adoption approval for request ID: ${adoptionRequestId}`);
  } catch (error) {
    console.error('Error publishing adoption approval:', error);
  }
};

const publishAdoptionRejected = async (adoptionRequestId, userId, animalId, reason) => {
  try {
    const message = {
      adoptionRequestId,
      userId,
      animalId,
      reason,
      timestamp: new Date().toISOString()
    };
    await redisClient.publish(CHANNELS.ADOPTION_REJECTED, JSON.stringify(message));
    console.log(`Published adoption rejection for request ID: ${adoptionRequestId}`);
  } catch (error) {
    console.error('Error publishing adoption rejection:', error);
  }
};

const publishAnimalAdopted = async (animalId, userId) => {
  try {
    const message = {
      animalId,
      userId,
      timestamp: new Date().toISOString()
    };
    await redisClient.publish(CHANNELS.ANIMAL_ADOPTED, JSON.stringify(message));
    console.log(`Published animal adopted for ID: ${animalId}`);
  } catch (error) {
    console.error('Error publishing animal adopted:', error);
  }
};

// Subscriber setup function
const setupSubscribers = () => {
  // Animal update subscriber
  redisClient.subscribe(CHANNELS.ANIMAL_UPDATED, (err) => {
    if (err) {
      console.error('Failed to subscribe to animal updates:', err);
    } else {
      console.log('Subscribed to animal updates');
    }
  });

  // Adoption approved subscriber
  redisClient.subscribe(CHANNELS.ADOPTION_APPROVED, (err) => {
    if (err) {
      console.error('Failed to subscribe to adoption approvals:', err);
    } else {
      console.log('Subscribed to adoption approvals');
    }
  });

  // Adoption rejected subscriber
  redisClient.subscribe(CHANNELS.ADOPTION_REJECTED, (err) => {
    if (err) {
      console.error('Failed to subscribe to adoption rejections:', err);
    } else {
      console.log('Subscribed to adoption rejections');
    }
  });

  // Animal adopted subscriber
  redisClient.subscribe(CHANNELS.ANIMAL_ADOPTED, (err) => {
    if (err) {
      console.error('Failed to subscribe to animal adopted:', err);
    } else {
      console.log('Subscribed to animal adopted');
    }
  });

  // Message handler
  redisClient.on('message', (channel, message) => {
    try {
      const data = JSON.parse(message);
      console.log(`Received message on channel ${channel}:`, data);

      // Handle different message types
      switch (channel) {
        case CHANNELS.ANIMAL_UPDATED:
          handleAnimalUpdate(data);
          break;
        case CHANNELS.ADOPTION_APPROVED:
          handleAdoptionApproval(data);
          break;
        case CHANNELS.ADOPTION_REJECTED:
          handleAdoptionRejection(data);
          break;
        case CHANNELS.ANIMAL_ADOPTED:
          handleAnimalAdopted(data);
          break;
        default:
          console.log(`Unknown channel: ${channel}`);
      }
    } catch (error) {
      console.error('Error handling Redis message:', error);
    }
  });
};

// Event handlers (can be extended for WebSocket notifications, etc.)
const handleAnimalUpdate = (data) => {
  console.log(`Animal ${data.animalId} was updated`);
  // Invalidate related cache
  invalidateAnimalCache(data.animalId);
};

const handleAdoptionApproval = (data) => {
  console.log(`Adoption request ${data.adoptionRequestId} was approved for user ${data.userId}`);
  // Send notification to user, update cache, etc.
};

const handleAdoptionRejection = (data) => {
  console.log(`Adoption request ${data.adoptionRequestId} was rejected for user ${data.userId}: ${data.reason}`);
  // Send notification to user
};

const handleAnimalAdopted = (data) => {
  console.log(`Animal ${data.animalId} was adopted by user ${data.userId}`);
  // Invalidate cache, send notifications
  invalidateAnimalCache(data.animalId);
};

// Cache invalidation helper
const invalidateAnimalCache = async (animalId) => {
  try {
    await invalidateCache('animals:*');
    await invalidateCache(`animal:${animalId}`);
    console.log(`Invalidated cache for animal ${animalId}`);
  } catch (error) {
    console.error('Error invalidating animal cache:', error);
  }
};

module.exports = {
  CHANNELS,
  publishAnimalUpdated,
  publishAdoptionApproved,
  publishAdoptionRejected,
  publishAnimalAdopted,
  setupSubscribers,
  handleAnimalUpdate,
  handleAdoptionApproval,
  handleAdoptionRejection,
  handleAnimalAdopted,
  invalidateCache,
  invalidateAnimalCache
};
