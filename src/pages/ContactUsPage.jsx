
import React from 'react';
import PageTransition from '../components/PageTransition';
import { motion } from 'framer-motion';
import './ContactUsPage.css';

const teamMembers = [
  {
    name: 'John Doe',
    role: 'CEO',
    phone: '+1 (555) 123-4567',
    email: 'john.doe@darshan360.com',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    bio: 'Visionary leader with 15+ years in travel and hospitality.'
  },
  {
    name: 'Jane Smith',
    role: 'Head of Operations',
    phone: '+1 (555) 987-6543',
    email: 'jane.smith@darshan360.com',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    bio: 'Ensures every trip runs smoothly and guests are happy.'
  },
  {
    name: 'Peter Jones',
    role: 'Customer Support Lead',
    phone: '+1 (555) 555-5555',
    email: 'peter.jones@darshan360.com',
    avatar: 'https://randomuser.me/api/portraits/men/65.jpg',
    bio: 'Always ready to help you with bookings and queries.'
  },
  {
    name: 'tony stark',
    role: 'Lead Developer',
    phone: '+91 870720XXXX',
    email: 'mayankmishra0403@gmail.com',
    avatar: 'https://randomuser.me/api/portraits/men/12.jpg',
    bio: 'Building seamless digital travel experiences.'
  }
];


const ContactUsPage = () => {
  return (
    <PageTransition>
      <motion.div 
        className="contact-us-container"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <motion.h1 
          className="contact-title"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >Contact Us</motion.h1>
        <motion.p 
          className="contact-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >We’re here to help! Reach out to our team for any queries, support, or partnership opportunities.</motion.p>

        <motion.div 
          className="contact-details-panel"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="contact-details-row">
            <div className="contact-details-block">
              <span className="contact-details-label">General Support</span>
              <span className="contact-details-value">support@darshan360.com</span>
            </div>
            <div className="contact-details-block">
              <span className="contact-details-label">Phone</span>
              <span className="contact-details-value">+91 98765 43210</span>
            </div>
            <div className="contact-details-block">
              <span className="contact-details-label">Office</span>
              <span className="contact-details-value">123, Main Street, Varanasi, India</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="team-grid"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.15 } }
          }}
        >
          {teamMembers.map((member, index) => (
            <motion.div
              key={index}
              className="team-member-card enhanced"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.04, boxShadow: '0 8px 32px rgba(80,80,200,0.18)' }}
            >
              <img src={member.avatar} alt={member.name} className="team-avatar" />
              <h2>{member.name}</h2>
              <p className="role">{member.role}</p>
              <p className="bio">{member.bio}</p>
              <div className="contact-info">
                <p><strong>Phone:</strong> <a href={`tel:${member.phone}`}>{member.phone}</a></p>
                <p><strong>Email:</strong> <a href={`mailto:${member.email}`}>{member.email}</a></p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </PageTransition>
  );
};

export default ContactUsPage;
