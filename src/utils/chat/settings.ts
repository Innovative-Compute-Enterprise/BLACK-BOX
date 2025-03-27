import { cortex } from '@/src/lib/ai/cortex';
import { SubscriptionWithProduct } from '@/src/types/types';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types_db';

// Define subscription tiers and their limits
export interface TierLimits {
  maxMessagesPerDay: number;
  maxTokensPerMessage: number;
  allowedModels: string[];
  allowFileUploads: boolean;
  maxFileSizeMB: number;
  maxConcurrentChats: number;
}

// Updated with real model IDs from your cortex.ts
export const SUBSCRIPTION_TIERS: Record<string, TierLimits> = {
  free: {
    maxMessagesPerDay: 20,
    maxTokensPerMessage: 2000,
    allowedModels: ['gemini-flash'], // Only the fastest/basic model
    allowFileUploads: false,
    maxFileSizeMB: 0,
    maxConcurrentChats: 3,
  },
  basic: {
    maxMessagesPerDay: 100,
    maxTokensPerMessage: 4000,
    allowedModels: ['gemini-flash', 'gpt-4o-mini'], // Basic models
    allowFileUploads: true,
    maxFileSizeMB: 10,
    maxConcurrentChats: 10,
  },
  premium: {
    maxMessagesPerDay: 500,
    maxTokensPerMessage: 8000,
    allowedModels: ['gemini-flash', 'gemini', 'gpt-4o-mini'], // More advanced models
    allowFileUploads: true,
    maxFileSizeMB: 50,
    maxConcurrentChats: 30,
  },
  enterprise: {
    maxMessagesPerDay: -1, // unlimited
    maxTokensPerMessage: 16000,
    allowedModels: ['gemini-flash', 'gemini', 'gpt-4o-mini', 'claude-sonnet-3.5'], // All models
    allowFileUploads: true,
    maxFileSizeMB: 100,
    maxConcurrentChats: -1, // unlimited
  }
};

// Map subscription product names to tier names - match these to your actual product names in Supabase
const PRODUCT_TO_TIER: Record<string, string> = {
  'Free Tier': 'free',
  'Basic Plan': 'basic',
  'Premium Plan': 'premium',
  'Enterprise Plan': 'enterprise',
};

// Logging utility with support for additional context
const logActivity = (userId: string, activity: string, details: any = {}) => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    userId,
    activity,
    details
  };
  
  console.log(JSON.stringify(logData));
  
  // You could also store these logs in Supabase for analysis
  // this.supabase.from('usage_logs').insert([logData]).then();
};

export class ChatSettings {
  private supabase;
  private cortexInstance;
  
  constructor() {
    // Initialize Supabase client
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    
    this.cortexInstance = cortex();
    console.log('ChatSettings initialized with real data');
  }
  
  // Get user's subscription data
  async getUserSubscription(userId: string): Promise<SubscriptionWithProduct | null> {
    logActivity(userId, 'fetch_subscription');
    
    try {
      // Skip the user check if it's causing errors
      /*
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select('id, email')
        .eq('id', userId)
        .single();
        
      if (userError || !userData) {
        logActivity(userId, 'user_not_found', { error: userError?.message });
        console.error('User not found:', userError);
        return null;
      }
      */
      
      // Now fetch subscription
      const { data, error } = await this.supabase
        .from('subscriptions')
        .select(`
          *,
          prices (
            *,
            products (*)
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created', { ascending: false })
        .limit(1)
        .single();
        
      if (error) {
        // If error code is PGRST116, it means no subscription found (not an error for our purposes)
        if (error.code === 'PGRST116') {
          logActivity(userId, 'no_subscription_found', { userId });
          return null;
        }
        
        logActivity(userId, 'subscription_error', { 
          error: error.message, 
          code: error.code,
          userId
        });
        console.error('Error fetching subscription:', error);
        return null;
      }
      
      if (!data) {
        logActivity(userId, 'no_subscription_found', { userId });
        return null;
      }
      
      logActivity(userId, 'subscription_found', { 
        subscription_id: data.id,
        status: data.status,
        product: data.prices?.products?.name || 'unknown'
      });
      
      return data as unknown as SubscriptionWithProduct;
    } catch (e) {
      console.error('Unexpected error fetching subscription:', e);
      logActivity(userId, 'unexpected_subscription_error', { error: e });
      return null;
    }
  }
  
  // Get user's tier limits
  async getUserTierLimits(userId: string): Promise<TierLimits> {
    const subscription = await this.getUserSubscription(userId);
    
    // Default to free tier if no active subscription
    if (!subscription || !subscription.prices?.products?.name) {
      logActivity(userId, 'assign_tier', { tier: 'free', reason: 'no_active_subscription' });
      return SUBSCRIPTION_TIERS.free;
    }
    
    const productName = subscription.prices.products.name;
    const tierName = PRODUCT_TO_TIER[productName] || 'free';
    
    logActivity(userId, 'assign_tier', { 
      tier: tierName, 
      product: productName,
      subscription_id: subscription.id
    });
    
    return SUBSCRIPTION_TIERS[tierName];
  }
  
  // Check if user can send a message
  async canSendMessage(userId: string, modelId: string, fileSize?: number): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    logActivity(userId, 'check_message_permission', { modelId, fileSize });
    
    const tierLimits = await this.getUserTierLimits(userId);
    
    // Check if model exists in cortex
    const allModels = this.cortexInstance.models();
    const modelExists = allModels.some(model => model.id === modelId);
    
    if (!modelExists) {
      logActivity(userId, 'permission_denied', { 
        reason: 'model_not_found', 
        model: modelId
      });
      
      return {
        allowed: false,
        reason: `The model ${modelId} does not exist in the system.`
      };
    }
    
    // Check if model is allowed for this tier
    if (!tierLimits.allowedModels.includes(modelId)) {
      logActivity(userId, 'permission_denied', { 
        reason: 'model_not_allowed', 
        model: modelId, 
        allowed_models: tierLimits.allowedModels 
      });
      
      return {
        allowed: false,
        reason: `The model ${modelId} is not available on your current plan.`
      };
    }
    
    // Check file upload permissions if applicable
    if (fileSize && fileSize > 0) {
      if (!tierLimits.allowFileUploads) {
        logActivity(userId, 'permission_denied', { 
          reason: 'file_uploads_not_allowed',
          tier_allows_uploads: tierLimits.allowFileUploads
        });
        
        return {
          allowed: false,
          reason: 'File uploads are not available on your current plan.'
        };
      }
      
      const fileSizeInMB = fileSize / (1024 * 1024);
      if (fileSizeInMB > tierLimits.maxFileSizeMB) {
        logActivity(userId, 'permission_denied', { 
          reason: 'file_size_exceeded',
          size_mb: fileSizeInMB.toFixed(2),
          max_allowed_mb: tierLimits.maxFileSizeMB
        });
        
        return {
          allowed: false,
          reason: `File size exceeds the ${tierLimits.maxFileSizeMB}MB limit for your plan.`
        };
      }
    }
    
    // Check if the model accepts files
    if (fileSize && fileSize > 0) {
      const modelConfig = allModels.find(model => model.id === modelId);
      if (modelConfig && !modelConfig.acceptsFiles) {
        logActivity(userId, 'permission_denied', { 
          reason: 'model_does_not_accept_files',
          model: modelId
        });
        
        return {
          allowed: false,
          reason: `The model ${modelId} does not support file uploads.`
        };
      }
    }
    
    // Check daily message limit by looking at the chats table
    if (tierLimits.maxMessagesPerDay > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count, error } = await this.supabase
        .from('chats')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', today.toISOString());
      
      if (error) {
        logActivity(userId, 'error_checking_message_count', { error: error.message });
        console.error('Error checking message count:', error);
        return { allowed: true }; // Allow on error to prevent blocking users
      }
      
      if (count && count >= tierLimits.maxMessagesPerDay) {
        logActivity(userId, 'permission_denied', { 
          reason: 'daily_limit_reached',
          count: count,
          max_allowed: tierLimits.maxMessagesPerDay
        });
        
        return {
          allowed: false,
          reason: `You've reached your daily message limit (${tierLimits.maxMessagesPerDay}). Please try again tomorrow or upgrade your plan.`
        };
      }
      
      logActivity(userId, 'daily_usage', { 
        current_count: count || 0,
        max_allowed: tierLimits.maxMessagesPerDay,
        remaining: tierLimits.maxMessagesPerDay - (count || 0)
      });
    }
    
    // Check concurrent chats limit
    if (tierLimits.maxConcurrentChats > 0) {
      const { count, error } = await this.supabase
        .from('chat_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      if (error) {
        logActivity(userId, 'error_checking_concurrent_chats', { error: error.message });
        console.error('Error checking concurrent chats:', error);
        return { allowed: true }; // Allow on error to prevent blocking users
      }
      
      if (count && count >= tierLimits.maxConcurrentChats) {
        logActivity(userId, 'permission_denied', { 
          reason: 'max_concurrent_chats_reached',
          count: count,
          max_allowed: tierLimits.maxConcurrentChats
        });
        
        return {
          allowed: false,
          reason: `You've reached your limit of ${tierLimits.maxConcurrentChats} concurrent chat sessions. Please close some existing chats before starting new ones.`
        };
      }
      
      logActivity(userId, 'concurrent_chats', { 
        current_count: count || 0,
        max_allowed: tierLimits.maxConcurrentChats,
        remaining: tierLimits.maxConcurrentChats - (count || 0)
      });
    }
    
    logActivity(userId, 'permission_granted', { 
      model: modelId,
      file_included: !!fileSize
    });
    
    return { allowed: true };
  }
  
  // Get available models for a user based on their subscription
  async getAvailableModels(userId: string): Promise<string[]> {
    const tierLimits = await this.getUserTierLimits(userId);
    
    logActivity(userId, 'fetch_available_models', { 
      models: tierLimits.allowedModels
    });
    
    return tierLimits.allowedModels;
  }
  
  // Get all model details available to a user
  async getAvailableModelDetails(userId: string): Promise<any[]> {
    const allowedModelIds = await this.getAvailableModels(userId);
    const allModels = this.cortexInstance.models();
    
    const availableModels = allModels.filter(model => 
      allowedModelIds.includes(model.id)
    );
    
    logActivity(userId, 'fetch_model_details', { 
      available_count: availableModels.length,
      model_ids: availableModels.map(m => m.id)
    });
    
    return availableModels;
  }
  
  // Check if a user can use a specific feature
  async canUseFeature(userId: string, feature: 'fileUpload' | 'customInstructions' | 'advancedContext'): Promise<boolean> {
    const tierLimits = await this.getUserTierLimits(userId);
    let allowed = false;
    
    switch (feature) {
      case 'fileUpload':
        allowed = tierLimits.allowFileUploads;
        break;
      case 'customInstructions':
        // Only available on basic+ plans
        allowed = tierLimits.maxTokensPerMessage >= 4000;
        break;
      case 'advancedContext':
        // Only available on premium+ plans
        allowed = tierLimits.maxTokensPerMessage >= 8000;
        break;
      default:
        allowed = false;
    }
    
    logActivity(userId, 'feature_check', { 
      feature, 
      allowed,
      tier_limits: {
        maxTokens: tierLimits.maxTokensPerMessage,
        allowsFiles: tierLimits.allowFileUploads
      }
    });
    
    return allowed;
  }
  
  // Get usage statistics for a user
  async getUserUsageStats(userId: string): Promise<{
    dailyUsage: number;
    totalChats: number;
    activeSessions: number;
    usagePercentage: number;
    modelUsage: Record<string, number>;
  }> {
    const tierLimits = await this.getUserTierLimits(userId);
    
    // Get daily message count (messages from today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: dailyCount, error: dailyError } = await this.supabase
      .from('chats')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today.toISOString());
    
    // Get total chats count
    const { count: totalCount, error: totalError } = await this.supabase
      .from('chats')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    // Get active sessions count
    const { count: sessionCount, error: sessionError } = await this.supabase
      .from('chat_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    // Get model usage statistics
    const { data: modelData, error: modelError } = await this.supabase
      .from('chats')
      .select('model')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    
    const modelUsage: Record<string, number> = {};
    
    if (modelData) {
      modelData.forEach(chat => {
        const model = chat.model || 'unknown';
        modelUsage[model] = (modelUsage[model] || 0) + 1;
      });
    }
    
    const dailyUsage = dailyCount || 0;
    const usagePercentage = tierLimits.maxMessagesPerDay > 0 
      ? Math.round((dailyUsage / tierLimits.maxMessagesPerDay) * 100) 
      : 0;
    
    const stats = {
      dailyUsage,
      totalChats: totalCount || 0,
      activeSessions: sessionCount || 0,
      usagePercentage,
      modelUsage
    };
    
    logActivity(userId, 'usage_stats', stats);
    
    return stats;
  }
  
  // Get remaining quota for a user
  async getRemainingQuota(userId: string): Promise<{
    remainingMessages: number;
    remainingPercentage: number;
    unlimited: boolean;
  }> {
    const tierLimits = await this.getUserTierLimits(userId);
    
    // If unlimited, return special values
    if (tierLimits.maxMessagesPerDay < 0) {
      return {
        remainingMessages: -1,
        remainingPercentage: 100,
        unlimited: true
      };
    }
    
    // Get today's usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count, error } = await this.supabase
      .from('chats')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today.toISOString());
    
    const usedToday = count || 0;
    const remaining = Math.max(0, tierLimits.maxMessagesPerDay - usedToday);
    const remainingPercentage = Math.round((remaining / tierLimits.maxMessagesPerDay) * 100);
    
    const quota = {
      remainingMessages: remaining,
      remainingPercentage,
      unlimited: false
    };
    
    logActivity(userId, 'quota_check', {
      used: usedToday,
      remaining,
      total: tierLimits.maxMessagesPerDay
    });
    
    return quota;
  }
}

// Export a singleton instance
export const chatSettings = new ChatSettings();
