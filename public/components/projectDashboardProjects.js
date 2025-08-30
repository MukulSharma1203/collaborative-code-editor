"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { createProject, getUserProjects } from "../../lib/firestoreService";

export default function ProjectDashboardProjects() {
  const router = useRouter();
  const { user } = useUser();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [showNameModal, setShowNameModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [nameError, setNameError] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Load user projects when component mounts or user changes
  useEffect(() => {
    if (user) {
      loadUserProjects();
    }
  }, [user]);

  const loadUserProjects = async () => {
    try {
      setLoadingProjects(true);
      const userProjects = await getUserProjects(user.id);
      setProjects(userProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  const closeModal = () => {
    const dialog = document.getElementById('addProject');
    if (dialog) {
      dialog.close();
    }
    setSelectedTemplate(null);
    setSelectedFilter('All');
  };

  const closeNameModal = () => {
    const dialog = document.getElementById('nameProject');
    if (dialog) {
      dialog.close();
    }
    setShowNameModal(false);
    setProjectName('');
    setNameError('');

  };

  const handleContinue = () => {
    if (selectedTemplate) {
      setShowNameModal(true);
      const nameDialog = document.getElementById('nameProject');
      if (nameDialog) {
        nameDialog.showModal();
      }
    }
  };

  const handleProjectNameChange = (e) => {
    const value = e.target.value;
    // Only allow letters and spaces
    const lettersOnly = /^[a-zA-Z\s]*$/;

    if (lettersOnly.test(value)) {
      setProjectName(value);
      setNameError('');
    } else {
      setNameError('Only letters and spaces are allowed');
    }
  };

  const handleFinish = async () => {
    if (projectName.trim() && projectName.trim().length > 0 && user) {
      try {
        setLoading(true);
        
        //**************MAIN SAVING IN DATABASE LOGIC HERE**************
        
        // Prepare project data
        const projectData = {
          name: projectName.trim(),
          template: selectedTemplate,
          description: `A ${selectedTemplate} project created with Co-Code Editor`,
          status: 'active'
        };

        // Save to Firestore
        const newProject = await createProject(projectData, user.id);
        
        console.log('Project created successfully:', newProject);
        
        // Refresh the projects list to show the new project
        await loadUserProjects();
        router.push(`/playground/${newProject.id}`);
        // Close modals and reset state
        closeNameModal();
        closeModal();
        setSelectedTemplate(null);
        setProjectName('');
        
      } catch (error) {
        console.error('Error creating project:', error);
        setNameError('Failed to create project. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      setNameError('Project name is required');
    }
  };

  const selectTemplate = (templateId) => {
    setSelectedTemplate(templateId);
  };
  const selectFilter = (filterId) => {
    setSelectedFilter(filterId);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString();
    } catch (error) {
      return 'Recently';
    }
  };

  const handleProjectClick = (project) => {
    router.push(`/playground/${project.id}`);
  };

  const getTemplateIcon = (template) => {
    switch (template) {
      case 'react':
        return (
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38-.318-.184-.688-.277-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44-.96-.236-2.006-.417-3.107-.534-.66-.905-1.345-1.727-2.035-2.447 1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442-1.107.117-2.154.298-3.113.538-.112-.49-.195-.964-.254-1.42-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87-.728.063-1.466.098-2.21.098-.74 0-1.477-.035-2.202-.093-.406-.582-.802-1.204-1.183-1.86-.372-.64-.71-1.29-1.018-1.946.303-.657.646-1.313 1.013-1.954.38-.66.773-1.286 1.18-1.866.728-.064 1.466-.098 2.21-.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933-.2-.39-.41-.783-.64-1.174-.225-.392-.465-.774-.705-1.146zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493-.28-.958-.646-1.956-1.1-2.98.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98-.45 1.017-.812 2.01-1.086 2.964-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39.24-.375.48-.762.705-1.158.225-.39.435-.788.636-1.18zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143-.695-.102-1.365-.23-2.006-.386.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295-.22-.005-.406-.05-.553-.132-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z" />
            </svg>
          </div>
        );
      case 'nextjs':
        return (
          <div className="w-8 h-8 bg-gray-600/20 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">N</span>
          </div>
        );
      case 'express':
        return (
          <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
            <span className="text-green-400 font-bold text-lg">E</span>
          </div>
        );
      case 'vue':
        return (
          <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24,1.61H14.06L12,5.16,9.94,1.61H0L12,22.39ZM12,14.08,5.16,2.23H9.59L12,6.41l2.41-4.18h4.43Z"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
        );
    }
  };

  const getTemplateColor = (template) => {
    switch (template) {
      case 'react':
        return 'from-blue-500/10 to-blue-600/10 border-blue-500/30 hover:border-blue-400/50';
      case 'nextjs':
        return 'from-gray-600/10 to-gray-700/10 border-gray-500/30 hover:border-gray-400/50';
      case 'express':
        return 'from-green-500/10 to-green-600/10 border-green-500/30 hover:border-green-400/50';
      case 'vue':
        return 'from-green-400/10 to-green-500/10 border-green-400/30 hover:border-green-300/50';
      default:
        return 'from-purple-500/10 to-purple-600/10 border-purple-500/30 hover:border-purple-400/50';
    }
  };

  return (
    <div className="relative h-screen overflow-hidden">
      {/* <!-- Background Pattern --> */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="relative h-full w-full bg-slate-950">
          <div className="absolute bottom-0 right-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(255,0,182,.15),rgba(255,255,255,0))]"></div>
        </div>
      </div>

      {/* <!-- Main Content --> */}
      <div className="flex justify-between relative z-10 h-20 border-b border-gray-700 w-full p-4 mx-auto max-w-7xl items-center">
        <div className="flex items-center gap-3">
          <lord-icon
            src="https://cdn.lordicon.com/jeuxydnh.json"
            trigger="hover"
            stroke="bold"
            colors="primary:#d4d1fa,secondary:#66d7ee"
            style={{ width: "50px", height: "50px" }} >
          </lord-icon>
          <h1 className=" text-3xl mt-2 bg-gradient-to-r from-purple-200 to-teal-200/70 bg-clip-text text-transparent font-semibold">
            Your Projects
          </h1>
        </div>

        <div className="flex items-center">
          <button 
            command="show-modal" 
            commandfor="addProject" 
            disabled={loading}
            className="group h-12 bg-gradient-to-r from-red-700 via-pink-700 to-orange-700 hover:from-red-600 hover:via-pink-600 hover:to-orange-600 border-2 border-black/20 hover:border-black/40 rounded-xl text-base px-6 py-3 font-bold text-white shadow-2xl hover:shadow-red-500/30 transform hover:scale-105 hover:-translate-y-1 transition-all duration-200 ease-out active:scale-95 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            )}
            <span className="font-bold tracking-wide">
              {loading ? 'Creating...' : 'Add New Project'}
            </span>
          </button>
        </div>
      </div>

      {/* Modal */}
      <el-dialog>
        <dialog id="addProject" aria-labelledby="dialog-title" className="fixed inset-0 size-auto max-h-none max-w-none overflow-y-auto bg-transparent backdrop:bg-transparent">
          <el-dialog-backdrop className="fixed inset-0 bg-gray-900/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"></el-dialog-backdrop>

          <div tabIndex="0" className="flex min-h-full items-center justify-center p-4 text-center focus:outline-none">
            <el-dialog-panel className="relative transform overflow-hidden rounded-lg bg-gray-900 text-left shadow-xl outline-1 outline-gray-700 transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in w-full max-w-4xl max-h-[90vh] data-closed:scale-95">

              {/* Header */}
              <div className="bg-gray-900 px-6 py-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                      <span className="text-red-500">+</span> Select a Template
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">Choose a template to create your new playground</p>
                  </div>
                  <button onClick={closeModal} className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="bg-gray-900 px-6 py-4 border-b border-gray-700">
                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    <button onClick={() => selectFilter("All")} className={`${selectedFilter === "All" ? "px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors" : "px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"}`}>All</button>
                    <button onClick={() => selectFilter("Frontend")} className={`${selectedFilter === "Frontend" ? "px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors" : "px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"}`}>Frontend</button>
                    <button onClick={() => selectFilter("Backend")} className={`${selectedFilter === "Backend" ? "px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors" : "px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"}`}>Backend</button>
                    <button onClick={() => selectFilter("Fullstack")} className={`${selectedFilter === "Fullstack" ? "px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors" : "px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"}`}>Fullstack</button>
                  </div>
                </div>
              </div>

              {/* Templates Grid */}
              <div className="bg-gray-900 p-6 overflow-y-auto max-h-[50vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* React Template */}
                  {(selectedFilter == 'All' || selectedFilter === 'Frontend') &&
                    <div
                      onClick={() => selectTemplate('react')}
                      className={`group relative bg-gray-800 border-2 rounded-lg p-4 transition-all duration-200 cursor-pointer ${selectedTemplate === 'react' ? 'border-red-500 bg-red-500/10' : 'border-gray-700 hover:border-purple-500'
                        }`}
                    >
                      {selectedTemplate === 'react' && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38-.318-.184-.688-.277-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44-.96-.236-2.006-.417-3.107-.534-.66-.905-1.345-1.727-2.035-2.447 1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442-1.107.117-2.154.298-3.113.538-.112-.49-.195-.964-.254-1.42-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87-.728.063-1.466.098-2.21.098-.74 0-1.477-.035-2.202-.093-.406-.582-.802-1.204-1.183-1.86-.372-.64-.71-1.29-1.018-1.946.303-.657.646-1.313 1.013-1.954.38-.66.773-1.286 1.18-1.866.728-.064 1.466-.098 2.21-.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933-.2-.39-.41-.783-.64-1.174-.225-.392-.465-.774-.705-1.146zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493-.28-.958-.646-1.956-1.1-2.98.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98-.45 1.017-.812 2.01-1.086 2.964-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39.24-.375.48-.762.705-1.158.225-.39.435-.788.636-1.18zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143-.695-.102-1.365-.23-2.006-.386.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295-.22-.005-.406-.05-.553-.132-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white font-semibold">React</h4>
                            <div className="flex text-yellow-400">
                              <span>★★★★★</span>
                            </div>
                          </div>
                          <p className="text-gray-400 text-sm mb-3">A JavaScript library for building user interfaces with component-based architecture</p>
                          <div className="flex gap-2">
                            <span className="px-2 py-1 bg-gray-700 text-xs text-gray-300 rounded">UI</span>
                            <span className="px-2 py-1 bg-gray-700 text-xs text-gray-300 rounded">Frontend</span>
                            <span className="px-2 py-1 bg-gray-700 text-xs text-gray-300 rounded">JavaScript</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  }

                  {/* Next.js Template */}
                  {(selectedFilter == 'All' || selectedFilter === 'Fullstack') &&
                    <div
                      onClick={() => selectTemplate('nextjs')}
                      className={`group relative bg-gray-800 border-2 rounded-lg p-4 transition-all duration-200 cursor-pointer ${selectedTemplate === 'nextjs' ? 'border-red-500 bg-red-500/10' : 'border-gray-700 hover:border-purple-500'
                        }`}
                    >
                      {selectedTemplate === 'nextjs' && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gray-600/20 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-xl">N</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white font-semibold">Next.js</h4>
                            <div className="flex text-yellow-400">
                              <span>★★★★☆</span>
                            </div>
                          </div>
                          <p className="text-gray-400 text-sm mb-3">The React framework for production with server-side rendering and static site generation</p>
                          <div className="flex gap-2">
                            <span className="px-2 py-1 bg-gray-700 text-xs text-gray-300 rounded">React</span>
                            <span className="px-2 py-1 bg-gray-700 text-xs text-gray-300 rounded">SSR</span>
                            <span className="px-2 py-1 bg-gray-700 text-xs text-gray-300 rounded">Fullstack</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                  {/* Express Template */}
                  {(selectedFilter == 'All' || selectedFilter === 'Backend') &&
                    <div
                      onClick={() => selectTemplate('express')}
                      className={`group relative bg-gray-800 border-2 rounded-lg p-4 transition-all duration-200 cursor-pointer ${selectedTemplate === 'express' ? 'border-red-500 bg-red-500/10' : 'border-gray-700 hover:border-purple-500'
                        }`}
                    >
                      {selectedTemplate === 'express' && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <span className="text-green-400 font-bold text-xl">E</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white font-semibold">Express</h4>
                            <div className="flex text-yellow-400">
                              <span>★★★★☆</span>
                            </div>
                          </div>
                          <p className="text-gray-400 text-sm mb-3">Fast, unopinionated, minimalist web framework for Node.js to build APIs and web applications</p>
                          <div className="flex gap-2">
                            <span className="px-2 py-1 bg-gray-700 text-xs text-gray-300 rounded">Node.js</span>
                            <span className="px-2 py-1 bg-gray-700 text-xs text-gray-300 rounded">API</span>
                            <span className="px-2 py-1 bg-gray-700 text-xs text-gray-300 rounded">Backend</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                  {/* Vue.js Template */}
                  {(selectedFilter == 'All' || selectedFilter === 'Frontend') &&
                    <div
                      onClick={() => selectTemplate('vue')}
                      className={`group relative bg-gray-800 border-2 rounded-lg p-4 transition-all duration-200 cursor-pointer ${selectedTemplate === 'vue' ? 'border-red-500 bg-red-500/10' : 'border-gray-700 hover:border-purple-500'
                        }`}
                    >
                      {selectedTemplate === 'vue' && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <span className="text-green-400 font-bold text-xl">V</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white font-semibold">Vue.js</h4>
                            <div className="flex text-yellow-400">
                              <span>★★★★☆</span>
                            </div>
                          </div>
                          <p className="text-gray-400 text-sm mb-3">Progressive JavaScript framework for building user interfaces with an approachable learning curve</p>
                          <div className="flex gap-2">
                            <span className="px-2 py-1 bg-gray-700 text-xs text-gray-300 rounded">UI</span>
                            <span className="px-2 py-1 bg-gray-700 text-xs text-gray-300 rounded">Frontend</span>
                            <span className="px-2 py-1 bg-gray-700 text-xs text-gray-300 rounded">JavaScript</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                </div>

              </div>

              {/* Footer with Buttons */}
              <div className=" bg-gray-800 px-6 py-4 border-t border-gray-700 flex = items-center justify-end">
                <button
                  onClick={closeModal}
                  className=" border-2 mx-4 rounded-lg h-11 px-6 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleContinue}
                  disabled={!selectedTemplate}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${selectedTemplate
                    ? 'bg-red-500 h-11 hover:bg-red-400 text-white'
                    : 'bg-gray-600 h-11 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  Continue
                </button>
              </div>

            </el-dialog-panel>
          </div>
        </dialog>
      </el-dialog>

      {/* Project Name Modal */}
      <el-dialog>
        <dialog id="nameProject" aria-labelledby="name-dialog-title" className="fixed inset-0 size-auto max-h-none max-w-none overflow-y-auto bg-transparent backdrop:bg-transparent">
          <el-dialog-backdrop className="fixed inset-0 bg-gray-900/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"></el-dialog-backdrop>

          <div tabIndex="0" className="flex min-h-full items-center justify-center p-4 text-center focus:outline-none">
            <el-dialog-panel className="relative transform overflow-hidden rounded-lg bg-gray-900 text-left shadow-xl outline-1 outline-gray-700 transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in w-full max-w-md data-closed:scale-95">

              {/* Header */}
              <div className="bg-gray-900 px-6 py-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                      <lord-icon
                        src="https://cdn.lordicon.com/exymduqj.json"
                        trigger="hover"
                        state="hover-line"
                        colors="primary:#ffffff,secondary:#c71f16"
                        style={{width:"30px" , height:"30px"}}>
                      </lord-icon> Project Name
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">Enter a name for your new project</p>
                  </div>
                  <button onClick={closeNameModal} className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="bg-gray-900 p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={handleProjectNameChange}
                    placeholder="Enter project name..."
                    className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${nameError
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-600 focus:border-red-500 focus:ring-red-500'
                      }`}
                    autoFocus
                  />
                  {nameError && (
                    <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {nameError}
                    </p>
                  )}
                </div>


              </div>

              {/* Footer */}
              <div className="bg-gray-800 px-6 py-4 border-t border-gray-700 flex justify-between items-center">
                <button
                  onClick={closeNameModal}
                  className="px-6 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinish}
                  disabled={!projectName.trim() || nameError || loading}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${projectName.trim() && !nameError && !loading
                      ? 'bg-red-500 hover:bg-red-400 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    'Finish'
                  )}
                </button>
              </div>

            </el-dialog-panel>
          </div>
        </dialog>
      </el-dialog>

      {/* cards */}
      <div className="relative z-10 flex-1 w-full p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {loadingProjects ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-3 text-white text-lg">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Loading your projects...
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {projects.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <div className="max-w-md mx-auto">
                    <lord-icon
                      src="https://cdn.lordicon.com/jeuxydnh.json"
                      trigger="loop"
                      colors="primary:#8b5cf6,secondary:#06b6d4"
                      style={{ width: "80px", height: "80px" }}
                      className="mx-auto mb-4">
                    </lord-icon>
                    <h3 className="text-gray-300 text-xl font-semibold mb-2">No projects yet</h3>
                    <p className="text-gray-400">Create your first project to get started!</p>
                  </div>
                </div>
              ) : (
                projects.map((project) => (
                  <div 
                    key={project.id} 
                    className={`relative bg-gradient-to-br ${getTemplateColor(project.template)} border rounded-xl p-6 transition-all duration-300 hover:shadow-xl group cursor-pointer transform hover:scale-105 hover:-translate-y-1`}
                    onClick={() => handleProjectClick(project)}
                    style={{
                      boxShadow: `0 4px 20px rgba(${
                        project.template === 'react' ? '59, 130, 246' :
                        project.template === 'vue' || project.template === 'express' ? '34, 197, 94' :
                        project.template === 'nextjs' ? '107, 114, 128' :
                        '147, 51, 234'
                      }, 0.1)`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `0 8px 30px rgba(${
                        project.template === 'react' ? '59, 130, 246' :
                        project.template === 'vue' || project.template === 'express' ? '34, 197, 94' :
                        project.template === 'nextjs' ? '107, 114, 128' :
                        '147, 51, 234'
                      }, 0.3)`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = `0 4px 20px rgba(${
                        project.template === 'react' ? '59, 130, 246' :
                        project.template === 'vue' || project.template === 'express' ? '34, 197, 94' :
                        project.template === 'nextjs' ? '107, 114, 128' :
                        '147, 51, 234'
                      }, 0.1)`
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getTemplateIcon(project.template)}
                        <div>
                          <h3 className="text-white font-semibold text-lg leading-tight">{project.name}</h3>
                          <span className="text-xs text-gray-400 capitalize">{project.template} Project</span>
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${project.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`}></div>
                    </div>
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">{project.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          project.template === 'react' ? 'bg-blue-500/20 text-blue-300' :
                          project.template === 'nextjs' ? 'bg-gray-500/20 text-gray-300' :
                          project.template === 'express' ? 'bg-green-500/20 text-green-300' :
                          project.template === 'vue' ? 'bg-green-400/20 text-green-300' :
                          'bg-purple-500/20 text-purple-300'
                        } capitalize`}>
                          {project.template}
                        </span>
                      </div>
                      <span className="text-gray-500 text-xs">
                        {formatDate(project.updatedAt)}
                      </span>
                    </div>
                    
                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"></div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>

  )
}

