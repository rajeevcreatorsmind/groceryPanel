// lib/autoStatusUpdater.ts
import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  Timestamp,
  writeBatch ,
  getDoc,     
  doc, 
} from 'firebase/firestore';
import { isBefore, isWithinInterval } from 'date-fns';

// This function updates all slider statuses automatically
export async function updateSliderStatuses() {
  try {
    console.log('🔄 Starting slider status update...');
    
    // Get all sliders that are not drafts
    const slidersRef = collection(db, 'sliders');
    const q = query(
      slidersRef,
      where('publishType', '!=', 'draft') // Only update scheduled sliders
    );
    
    const snapshot = await getDocs(q);
    const now = new Date();
    let updatedCount = 0;
    
    // Use batch for better performance
    const batch = writeBatch(db);
    
    for (const doc of snapshot.docs) {
      const slider = doc.data();
      const sliderId = doc.id;
      
      // Get dates
      const startDate = slider.startDate?.toDate();
      const endDate = slider.endDate?.toDate();
      
      if (!startDate || !endDate) {
        console.warn(`Slider ${sliderId} missing dates, skipping`);
        continue;
      }
      
      let newStatus: 'upcoming' | 'active' | 'expired';
      
      // Calculate new status
      if (isBefore(now, startDate)) {
        newStatus = 'upcoming';
      } else if (isWithinInterval(now, { start: startDate, end: endDate })) {
        newStatus = 'active';
      } else {
        newStatus = 'expired';
      }
      
      // Update only if status changed
      if (slider.status !== newStatus) {
        batch.update(doc.ref, {
          status: newStatus,
          updatedAt: Timestamp.now(),
        });
        updatedCount++;
        
        console.log(`✅ Updated slider "${slider.title}" from ${slider.status} to ${newStatus}`);
      }
    }
    
    // Commit all updates at once
    if (updatedCount > 0) {
      await batch.commit();
      console.log(`✅ Successfully updated ${updatedCount} slider(s)`);
    } else {
      console.log('✅ No status updates needed');
    }
    
    return updatedCount;
  } catch (error) {
    console.error('❌ Error updating slider statuses:', error);
    throw error;
  }
}

// Optional: Also update drafts if they have dates and user wants to publish them
export async function updateDraftToScheduled(sliderId: string) {
  try {
    const sliderRef = doc(db, 'sliders', sliderId);
    const sliderDoc = await getDoc(sliderRef);
    
    if (!sliderDoc.exists()) {
      throw new Error('Slider not found');
    }
    
    const slider = sliderDoc.data();
    
    if (slider.publishType !== 'draft') {
      throw new Error('Slider is not a draft');
    }
    
    const startDate = slider.startDate?.toDate();
    const endDate = slider.endDate?.toDate();
    const now = new Date();
    
    if (!startDate || !endDate) {
      throw new Error('Draft slider missing dates');
    }
    
    let newStatus: 'upcoming' | 'active' | 'expired';
    
    if (isBefore(now, startDate)) {
      newStatus = 'upcoming';
    } else if (isWithinInterval(now, { start: startDate, end: endDate })) {
      newStatus = 'active';
    } else {
      newStatus = 'expired';
    }
    
    await updateDoc(sliderRef, {
      publishType: 'scheduled',
      status: newStatus,
      updatedAt: Timestamp.now(),
    });
    
    console.log(`✅ Draft "${slider.title}" published as ${newStatus}`);
    return newStatus;
  } catch (error) {
    console.error('❌ Error publishing draft:', error);
    throw error;
  }
}

// Start periodic updates
export function startAutoStatusUpdates(intervalMinutes: number = 60) {
  // Update immediately when component mounts
  updateSliderStatuses().catch(console.error);
  
  // Then update periodically
  const interval = setInterval(() => {
    updateSliderStatuses().catch(console.error);
  }, intervalMinutes * 60 * 1000);
  
  console.log(`⏰ Auto status updates started (every ${intervalMinutes} minutes)`);
  
  return interval;
}

// Manual trigger function (can be called from UI)
export function triggerManualUpdate() {
  return updateSliderStatuses();
}