// Complete navigation fix for mobile and desktop
document.addEventListener('DOMContentLoaded', function() {
    // ---------- Basic Navigation Setup ----------
    
    // Navbar scroll effect
    function handleScrollEffect() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
    
    // Initialize scroll effect
    handleScrollEffect();
    window.addEventListener('scroll', handleScrollEffect);
    
    // ---------- Mobile Menu Fix ----------
    
    // Get references to hamburger and mobile menu
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    const body = document.body;
    
    // Hamburger click handler
    if (hamburger) {
        hamburger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.toggle('active');
            
            if (mobileMenu) {
                mobileMenu.classList.toggle('active');
                
                // Toggle body scroll
                if (mobileMenu.classList.contains('active')) {
                    body.classList.add('no-scroll');
                } else {
                    body.classList.remove('no-scroll');
                }
            }
        });
    }
    
    // Handle clicks outside the mobile menu
    document.addEventListener('click', function(e) {
        if (mobileMenu && mobileMenu.classList.contains('active')) {
            if (!mobileMenu.contains(e.target) && e.target !== hamburger) {
                mobileMenu.classList.remove('active');
                if (hamburger) hamburger.classList.remove('active');
                body.classList.remove('no-scroll');
            }
        }
    });
    
    // ---------- Fix Navigation Links ----------
    
    // Handle both desktop nav links and mobile menu links
    const allNavLinks = [
        ...Array.from(document.querySelectorAll('.nav-links a')), 
        ...Array.from(document.querySelectorAll('.mobile-menu a'))
    ];
    
    allNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // If it's a section link
            if (href && href.startsWith('#') && href !== '#') {
                e.preventDefault();
                
                // Get the target section ID
                const targetId = href.substring(1);
                
                // Close mobile menu if open
                if (mobileMenu && mobileMenu.classList.contains('active')) {
                    mobileMenu.classList.remove('active');
                    if (hamburger) hamburger.classList.remove('active');
                    body.classList.remove('no-scroll');
                }
                
                // For section links that need dynamic loading
                if (['weddings', 'events', 'business', 'home'].includes(targetId)) {
                    // Find the corresponding filter button and click it
                    const filterBtn = document.querySelector(`.filter-btn[data-target="${targetId}"]`);
                    if (filterBtn) {
                        filterBtn.click();
                    } else {
                        // Fallback: go to section directly
                        scrollToSection(targetId);
                    }
                } else {
                    // Regular anchor link
                    scrollToSection(targetId);
                }
            }
        });
    });
    
    // Function to scroll to a section
    function scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const navHeight = document.querySelector('.navbar').offsetHeight;
            const filterNavHeight = document.querySelector('.filter-nav-container')?.offsetHeight || 0;
            const topOffset = section.getBoundingClientRect().top + window.scrollY - navHeight - filterNavHeight - 20;
            
            window.scrollTo({
                top: topOffset,
                behavior: 'smooth'
            });
        }
    }
    
    // ---------- Dynamic Section Loading ----------
    
    // Store original sections content
    const sectionContents = {};
    
    // Define the sections we'll handle
    const productSectionIds = ['weddings', 'events', 'business', 'home'];
    
    // Save original content and remove all sections except the first one
    productSectionIds.forEach((sectionId, index) => {
        const section = document.getElementById(sectionId);
        if (section) {
            // Store the original HTML content
            sectionContents[sectionId] = section.innerHTML;
            
            // Keep only the first section visible initially (weddings)
            if (index > 0) {
                // Replace section content with an empty placeholder to reduce DOM size
                section.innerHTML = '';
                section.style.display = 'none';
            }
        }
    });
    
    // Create the filter navigation
    createDynamicFilterNavigation();
    
    // Add scroll to top button
    createScrollToTopButton();
    
    function createDynamicFilterNavigation() {
        // Define product sections for the filter
        const productSections = [
            { id: 'weddings', name: 'Weddings' },
            { id: 'events', name: 'Events' },
            { id: 'business', name: 'Business' },
            { id: 'home', name: 'Household' }
        ];
        
        // Create the container
        const filterNavContainer = document.createElement('div');
        filterNavContainer.className = 'filter-nav-container';
        
        // Create the filter navigation
        const filterNav = document.createElement('div');
        filterNav.className = 'filter-nav';
        
        // Add buttons for each section
        productSections.forEach((section, index) => {
            const button = document.createElement('button');
            button.className = 'filter-btn';
            button.dataset.target = section.id;
            button.textContent = section.name;
            
            // Set the first button (Weddings) as active by default
            if (index === 0) {
                button.classList.add('active');
            }
            
            filterNav.appendChild(button);
        });
        
        // Append to container
        filterNavContainer.appendChild(filterNav);
        
        // Find the first product section to insert before
        const firstProductSection = document.getElementById('weddings');
        
        if (firstProductSection) {
            const parentSection = firstProductSection.parentNode;
            parentSection.insertBefore(filterNavContainer, firstProductSection);
        }
        
        // Initialize the filter functionality
        initializeDynamicFilter();
        
        // Check if filter navigation has overflow
        checkFilterNavOverflow(filterNav);
        window.addEventListener('resize', () => checkFilterNavOverflow(filterNav));
    }
    
    function checkFilterNavOverflow(filterNav) {
        if (filterNav.scrollWidth > filterNav.clientWidth) {
            filterNav.classList.add('has-overflow');
        } else {
            filterNav.classList.remove('has-overflow');
        }
    }
    
    function initializeDynamicFilter() {
        // Get all filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        // Initialize loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'section-loading';
        loadingIndicator.innerHTML = '<div class="loader"></div><p>Loading...</p>';
        document.body.appendChild(loadingIndicator);
        
        // Track currently active section
        let activeSection = 'weddings';
        
        // Add click event to each button
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                const targetId = this.dataset.target;
                
                // Skip if already active
                if (targetId === activeSection) return;
                
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Show loading indicator
                loadingIndicator.classList.add('active');
                
                // Use setTimeout to allow the browser to render the loading state
                setTimeout(() => {
                    // Hide the current active section
                    const currentSection = document.getElementById(activeSection);
                    if (currentSection) {
                        currentSection.style.display = 'none';
                    }
                    
                    // Show and populate the target section
                    const targetSection = document.getElementById(targetId);
                    if (targetSection) {
                        // If section is empty, restore its content
                        if (targetSection.innerHTML.trim() === '') {
                            targetSection.innerHTML = sectionContents[targetId];
                            
                            // Reinitialize carousels in this section
                            const productCards = targetSection.querySelectorAll('.product-card');
                            initializeCarouselsInSection(productCards);
                        }
                        
                        targetSection.style.display = 'block';
                        
                        // Scroll to this section
                        scrollToSection(targetId);
                        
                        // Update the active section
                        activeSection = targetId;
                    }
                    
                    // Hide loading indicator
                    loadingIndicator.classList.remove('active');
                    
                    // Fix about section animations if needed
                    fixAboutSection();
                }, 50); // Short delay to show loading state
            });
        });
    }
    
    function initializeCarouselsInSection(productCards) {
        productCards.forEach(card => {
            const slides = card.querySelectorAll('.carousel-slide');
            if (slides.length <= 1) return; // Skip if only one image
            
            const productImage = card.querySelector('.product-image');
            const track = card.querySelector('.carousel-track');
            
            // Create or get navigation elements
            let dotsContainer = card.querySelector('.carousel-dots');
            let prevButton = card.querySelector('.carousel-button.prev');
            let nextButton = card.querySelector('.carousel-button.next');
            
            if (!dotsContainer) {
                dotsContainer = document.createElement('div');
                dotsContainer.className = 'carousel-dots';
                productImage.appendChild(dotsContainer);
            }
            
            if (!prevButton) {
                prevButton = document.createElement('button');
                prevButton.className = 'carousel-button prev';
                prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
                productImage.appendChild(prevButton);
            }
            
            if (!nextButton) {
                nextButton = document.createElement('button');
                nextButton.className = 'carousel-button next';
                nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
                productImage.appendChild(nextButton);
            }
            
            // Create dots for each slide
            dotsContainer.innerHTML = '';
            slides.forEach((_, index) => {
                const dot = document.createElement('div');
                dot.className = 'dot';
                if (index === 0) dot.classList.add('active');
                dotsContainer.appendChild(dot);
            });
            
            // Set up carousel state
            let currentIndex = 0;
            const dots = dotsContainer.querySelectorAll('.dot');
            
            // Add touch swiping capability
            let touchStartX = 0;
            let touchEndX = 0;
            const minSwipeDistance = 50; // Minimum distance to trigger swipe
            
            productImage.addEventListener('touchstart', function(e) {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });
            
            productImage.addEventListener('touchend', function(e) {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipe();
            }, { passive: true });
            
            function handleSwipe() {
                const distance = touchStartX - touchEndX;
                if (Math.abs(distance) > minSwipeDistance) {
                    if (distance > 0) {
                        // Swipe left, go to next slide
                        goToSlide(currentIndex + 1);
                    } else {
                        // Swipe right, go to previous slide
                        goToSlide(currentIndex - 1);
                    }
                }
            }
            
            // Function to go to a specific slide
            function goToSlide(index) {
                if (!track) return;
                
                // Handle wrap-around
                if (index < 0) {
                    index = slides.length - 1;
                } else if (index >= slides.length) {
                    index = 0;
                }
                
                currentIndex = index;
                
                // Use transform for better performance
                track.style.transition = 'transform 0.3s ease-out';
                track.style.transform = `translateX(-${currentIndex * 100}%)`;
                
                // Update dots
                dots.forEach((dot, i) => {
                    if (i === currentIndex) {
                        dot.classList.add('active');
                    } else {
                        dot.classList.remove('active');
                    }
                });
            }
            
            // Set up event listeners
            prevButton.addEventListener('click', () => goToSlide(currentIndex - 1));
            nextButton.addEventListener('click', () => goToSlide(currentIndex + 1));
            
            // Click event for dots
            dots.forEach((dot, index) => {
                dot.addEventListener('click', () => goToSlide(index));
            });
        });
    }
    
    // Fix about section animations
    function fixAboutSection() {
        const aboutSection = document.getElementById('about');
        
        if (aboutSection) {
            // Add class to trigger CSS animations
            aboutSection.classList.add('about-section-visible');
            
            // Get all cards
            const cards = aboutSection.querySelectorAll('.about-card');
            
            // Add staggered animation delay
            cards.forEach((card, index) => {
                card.style.animationDelay = `${0.2 * (index + 1)}s`;
            });
            
            // Also handle any other animations in the section
            const animateElements = aboutSection.querySelectorAll('.animate-text, .animate-float');
            animateElements.forEach((element, index) => {
                element.style.animationDelay = `${0.1 * (index + 1)}s`;
                element.style.opacity = '0';
                element.style.animation = 'fadeInUp 0.6s ease forwards';
            });
        }
    }
    
    // Call this on initial load
    fixAboutSection();
    
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .filter-btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const ripple = document.createElement('span');
            ripple.className = 'ripple-effect';
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            button.appendChild(ripple);
            
            // Remove ripple after animation
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Initialize contact form functionality
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('name').value;
            
            // Show success message
            const formContainer = contactForm.parentNode;
            
            // Create success message
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.innerHTML = `
                <h3>Thank You, ${name}!</h3>
                <p>Your message has been sent successfully. We'll get back to you soon.</p>
                <button class="btn-secondary" id="resetForm">Send Another Message</button>
            `;
            
            // Hide form and show success message
            contactForm.style.display = 'none';
            formContainer.appendChild(successMessage);
            
            // Reset form button
            document.getElementById('resetForm').addEventListener('click', function() {
                contactForm.reset();
                contactForm.style.display = 'block';
                successMessage.remove();
            });
        });
    }
});

// Create scroll to top button
function createScrollToTopButton() {
    // Create button element
    const scrollTopButton = document.createElement('div');
    scrollTopButton.className = 'scroll-to-top';
    scrollTopButton.innerHTML = '<i class="fas fa-chevron-up"></i>';
    
    // Append to body
    document.body.appendChild(scrollTopButton);
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', function() {
        if (window.scrollY > 500) {
            scrollTopButton.classList.add('visible');
        } else {
            scrollTopButton.classList.remove('visible');
        }
    });
    
    // Scroll to top on click
    scrollTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Enhanced filter navigation behavior
function enhanceFilterNavigation() {
    const filterNav = document.querySelector('.filter-nav');
    if (!filterNav) return;
    
    // Center active button on mobile
    function centerActiveButton() {
        if (window.innerWidth <= 768) {
            const activeButton = filterNav.querySelector('.filter-btn.active');
            if (activeButton) {
                // Calculate the scroll position to center the active button
                const navWidth = filterNav.offsetWidth;
                const buttonLeft = activeButton.offsetLeft;
                const buttonWidth = activeButton.offsetWidth;
                
                // Center the button
                filterNav.scrollLeft = buttonLeft - (navWidth / 2) + (buttonWidth / 2);
            }
        } else {
            // Reset scroll position on desktop
            filterNav.scrollLeft = 0;
        }
    }
    
    // Center active button after a slight delay
    setTimeout(centerActiveButton, 100);
    
    // When filter buttons are clicked
    const filterButtons = filterNav.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        const originalClick = button.onclick;
        
        button.onclick = function(e) {
            // Call the original click handler
            if (originalClick) originalClick.call(this, e);
            
            // Center the active button
            setTimeout(centerActiveButton, 100);
        };
    });
    
    // Add touch scroll indicator
    if (window.innerWidth <= 768) {
        let isScrolling = false;
        
        filterNav.addEventListener('scroll', () => {
            // Show visual feedback that we're scrolling
            if (!isScrolling) {
                filterNav.classList.add('is-scrolling');
                isScrolling = true;
            }
            
            // Clear the timeout if it exists
            if (filterNav.scrollTimeout) {
                clearTimeout(filterNav.scrollTimeout);
            }
            
            // Set a timeout to remove the class after scrolling stops
            filterNav.scrollTimeout = setTimeout(() => {
                filterNav.classList.remove('is-scrolling');
                isScrolling = false;
            }, 300);
        });
        
        // Add arrows for better UX on mobile if there's overflow
        if (filterNav.scrollWidth > filterNav.clientWidth) {
            // Add visual indicator that there's more to scroll
            const scrollIndicator = document.createElement('div');
            scrollIndicator.className = 'filter-scroll-indicator';
            scrollIndicator.innerHTML = '<i class="fas fa-chevron-right"></i>';
            filterNav.parentNode.appendChild(scrollIndicator);
            
            // Remove indicator after first scroll
            filterNav.addEventListener('scroll', () => {
                if (scrollIndicator.parentNode) {
                    setTimeout(() => {
                        scrollIndicator.classList.add('fade-out');
                        setTimeout(() => {
                            if (scrollIndicator.parentNode) {
                                scrollIndicator.parentNode.removeChild(scrollIndicator);
                            }
                        }, 300);
                    }, 1500);
                }
            }, { once: true });
        }
    }
    
    // Re-center when window resizes
    window.addEventListener('resize', centerActiveButton);
}

// Call this function after the filter navigation is created
document.addEventListener('DOMContentLoaded', function() {
    // Wait until navigation is created
    const checkNavigation = setInterval(() => {
        if (document.querySelector('.filter-nav')) {
            enhanceFilterNavigation();
            clearInterval(checkNavigation);
        }
    }, 100);
});
// Function to add to your script.js file
function fixFilterNavigationPosition() {
    // Get the filter navigation container
    const filterNavContainer = document.querySelector('.filter-nav-container');
    if (!filterNavContainer) return;
    
    // Function to update position based on screen width
    function updateFilterPosition() {
        // On desktop, ensure position is NOT sticky
        if (window.innerWidth > 768) {
            filterNavContainer.style.position = 'relative';
            filterNavContainer.style.top = 'auto';
        } 
        // On mobile, allow it to be sticky
        else {
            filterNavContainer.style.position = 'sticky';
            filterNavContainer.style.top = (window.innerWidth <= 480) ? '55px' : '60px';
        }
    }
    
    // Set position initially
    updateFilterPosition();
    
    // Update on window resize
    window.addEventListener('resize', updateFilterPosition);
}

// Call this function after creating the filter navigation
// Add this line to your createDynamicFilterNavigation function:
// After you create and append filterNavContainer to the DOM:
document.addEventListener('DOMContentLoaded', function() {
    // This will run after a slight delay to ensure the navigation is created
    setTimeout(fixFilterNavigationPosition, 100);
    
    // Also run it whenever the window is resized
    window.addEventListener('resize', fixFilterNavigationPosition);
});
// Add Back to Categories button dynamically
document.addEventListener('DOMContentLoaded', function() {
    // Create the back to categories button
    function addBackToCategoriesButton() {
        // Find the contact section
        const contactSection = document.getElementById('contact');
        
        if (contactSection) {
            // Create the button container
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'back-to-categories';
            
            // Create the button
            const button = document.createElement('button');
            button.className = 'back-to-categories-btn';
            button.innerHTML = '<i class="fas fa-arrow-up"></i> Back to Categories';
            
            // Add click event to scroll to the filter navigation
            button.addEventListener('click', function() {
                // Find the filter navigation
                const filterNav = document.querySelector('.filter-nav-container');
                
                if (filterNav) {
                    // Scroll to the filter navigation
                    const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0;
                    const offset = filterNav.getBoundingClientRect().top + window.scrollY - navbarHeight - 20;
                    
                    window.scrollTo({
                        top: offset,
                        behavior: 'smooth'
                    });
                } else {
                    // If filter nav not found, just go to the top of the page
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                }
            });
            
            // Add button to container
            buttonContainer.appendChild(button);
            
            // Insert the button before the contact section
            contactSection.parentNode.insertBefore(buttonContainer, contactSection);
        }
    }
    
    // Call the function to add the button
    addBackToCategoriesButton();
    
    // Also add the button if the DOM changes (for dynamic sites)
    const observer = new MutationObserver(function(mutations) {
        if (!document.querySelector('.back-to-categories')) {
            addBackToCategoriesButton();
        }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
});

document.getElementById('contactForm').addEventListener('submit', function(event) {
    event.preventDefault();

    var form = event.target;
    var formData = new FormData(form);

    fetch(form.action, {
        method: form.method,
        body: formData,
        headers: {
            'Accept': 'application/json'
        }
    }).then(response => {
        if (response.ok) {
            // Display success message
            document.getElementById('successMessage').style.display = 'block';
            form.reset();
        } else {
            // Display error message
            alert('Oops! Something went wrong.');
        }
    });
});