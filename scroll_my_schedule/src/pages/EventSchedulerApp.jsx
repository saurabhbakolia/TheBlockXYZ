import React, { useEffect, useState } from 'react'
import { Button, Card, Divider, message } from 'antd'
import axios from 'axios';
import { Modal, Form, Input, DatePicker } from 'antd';
// import moment from 'moment';


function EventSchedulerApp() {
    const [authorized, setAuthorized] = useState(false);
    const [events, setEvents] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    useEffect(() => {
        const saveCodeToSession = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            console.log("code: " + code);

            if (code) {
                sessionStorage.setItem('authorizationCode', code);
                setAuthorized(true);

                try {
                    // Make a request to the API endpoint to exchange the code for a token
                    const response = await axios.get(`http://localhost:8080/oauth/exchange?code=${code}`);
                    // Handle the response here
                    console.log("Token exchange response:", response.data);
                    // Once token is obtained, fetch the primary calendar ID
                    const calendarResponse = await axios.get(`http://localhost:8080/nylas/primary-calendar?code=${code}`);
                    // Store the primary calendar ID in session storage
                    sessionStorage.setItem('primaryCalendarId', calendarResponse.data.id);

                    // Set authorized state to true
                    setAuthorized(true);
                } catch (error) {
                    console.error("Error exchanging code for token:", error);
                }
            }
        };

        saveCodeToSession();
    }, []);

    const handleAuthorize = () => {
        // Redirect the user to the authorization URL
        window.location.href = 'http://localhost:8080/nylas/auth';
    };


    const handleCreateEvent = async () => {
        setIsModalVisible(true);
        console.log('Create event');
    };

    const handleListEvent = () => {
        console.log('List event');
        // Retrieve the authorization code from session storage
        const authorizationCode = sessionStorage.getItem('authorizationCode');
        console.log('Authorization code:', authorizationCode);
        if (!authorizationCode) {
            message.error('Authorization code not found');
            return;
        }

        // Make a request to the API endpoint to list events using Axios
        axios.get(`http://localhost:8080/nylas/list-events?code=${authorizationCode}`)
            .then(response => {
                // Handle the response data (e.g., display events)
                setEvents(response.data);
                console.log('List of events:', response.data);
            })
            .catch(error => {
                console.error('Error:', error);
                message.error('Failed to fetch events');
            });
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const handleConfirmEvent = async () => {
        console.log('Confirm event');
        try {
            // Validate the form fields
            const values = await form.validateFields();

            // Retrieve the authorization code from session storage
            const authorizationCode = sessionStorage.getItem('authorizationCode');
            if (!authorizationCode) {
                message.error('Authorization code not found');
                return;
            }

            // Extract form values
            const { title, startTime, endTime } = values;
            console.log('Form values:', title, startTime, endTime);
            // Make a GET request to the API endpoint to create an event
            const response = await axios.post(`http://localhost:8080/nylas/create-event?code=${authorizationCode}`,{
                title,
                startTime: startTime.unix(),
                endTime: endTime.unix(),
            });

            // Handle the response (e.g., display a success message)
            const eventData = response.data.data;
            console.log('Event created successfully:', eventData);

            // Update the state to include the new event
            setEvents(prevEvents => {
                // If prevEvents is not an array, initialize it as an empty array
                if (!Array.isArray(prevEvents)) {
                    prevEvents = [];
                }
                // Now you can safely spread prevEvents into a new array
                return [...prevEvents, eventData];
            });


            // Close the modal
            setIsModalVisible(false);
        } catch (error) {
            console.error('Error creating event:', error);
            // Handle errors (e.g., display an error message)
            message.error('Failed to create event');
        }
    };

    return (
        <div>
            <nav className='text-blue-600 py-2'>Event Scheduling App</nav>
            <main className='bg-blue-200'>
                <div>
                    <h1 className='text-4xl text-center py-4'>Welcome to the Event Scheduling App</h1>
                    <p className='text-center py-4'>This app will allow you to schedule events and view them on a calendar</p>
                    <div className='text-center py-4'>
                        {authorized ? (
                            <>
                                <Button type="primary" onClick={handleListEvent}>List Event</Button>
                                <Button type="primary" onClick={handleCreateEvent}>Create Event</Button>
                            </>
                        ) : (
                            <Button type="primary" onClick={handleAuthorize}>Authorize</Button>
                        )}
                    </div>
                    <div className="flex flex-wrap justify-center">
                        {events.length > 0 ? events.map(event => (
                            <Card key={event.id} title={event.title} style={{ width: 300, margin: '0.5rem' }}>
                                <p><strong>Description:</strong> {event.description || 'No description'}</p>
                                <p><strong>Start Time:</strong> {new Date(event.when.startTime * 1000).toLocaleString()}</p>
                                <p><strong>End Time:</strong> {new Date(event.when.endTime * 1000).toLocaleString()}</p>
                                <a href={event.htmlLink} target="_blank" rel="noopener noreferrer">View Event</a>
                                <Divider />
                            </Card>
                        )) : <h4 className='text-blue-400'>No events to display.</h4>}
                    </div>

                    {/* <div className="flex flex-wrap justify-center">
                        {events.length >= 1 ? events.map(event => (
                            <Card key={event.id} title={event.title} style={{ width: 300, margin: '0.5rem' }}>
                                <p>Description: {event.description || 'No description'}</p>
                                <p>Start Time: {new Date(event.when.startTime * 1000).toLocaleString()}</p>
                                <p>End Time: {new Date(event.when.endTime * 1000).toLocaleString()}</p>
                                <a href={event.htmlLink} target="_blank" rel="noopener noreferrer">View Event</a>
                            </Card>
                        )) : ""}
                    </div> */}

                </div>
            </main>
            <Modal
                title="Create Event"
                visible={isModalVisible}
                onCancel={handleCancel}
                footer={[
                    <Button key="cancel" onClick={handleCancel}>Cancel</Button>,
                    <Button key="confirm" type="primary" onClick={handleConfirmEvent}>Confirm</Button>
                ]}
            >
                <Form form={form} layout="vertical">
                    <Form.Item label="Event Title" name="title" rules={[{ required: true, message: 'Please enter the event title' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Start Time" name="startTime" rules={[{ required: true, message: 'Please select the start time' }]}>
                        <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" />
                    </Form.Item>
                    <Form.Item label="End Time" name="endTime" rules={[{ required: true, message: 'Please select the end time' }]}>
                        <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default EventSchedulerApp