import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase.config';

// Collection name
const PROJECTS_COLLECTION = 'projects';

// Create a new project
export const createProject = async (projectData, userId) => {
  try {
    const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), {
      ...projectData,
      userId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'active'
    });
    
    console.log('Project created with ID: ', docRef.id);
    return { id: docRef.id, ...projectData, userId, status: 'active' };
  } catch (error) {
    console.error('Error creating project: ', error);
    throw error;
  }
};

// Get all projects for a specific user
export const getUserProjects = async (userId) => {
  try {
    const q = query(
      collection(db, PROJECTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const projects = [];
    
    querySnapshot.forEach((doc) => {
      projects.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return projects;
  } catch (error) {
    console.error('Error getting projects: ', error);
    throw error;
  }
};

// Update a project
export const updateProject = async (projectId, updateData) => {
  try {
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    await updateDoc(projectRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    
    console.log('Project updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating project: ', error);
    throw error;
  }
};

// Delete a project
export const deleteProject = async (projectId) => {
  try {
    await deleteDoc(doc(db, PROJECTS_COLLECTION, projectId));
    console.log('Project deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting project: ', error);
    throw error;
  }
};
