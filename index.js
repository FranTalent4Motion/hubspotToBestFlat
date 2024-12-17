require('dotenv').config();
const express = require('express');
const { Client } = require('@hubspot/api-client');
const axios = require('axios');

const app = express();
const port = 3000;

const hubspotClient = new Client({
    accessToken: process.env.HUBSPOT_API_TOKEN
});

app.use(express.json());

app.post('/starOneToBestFlat/', async (req, res) => {
    // const { objectId } = req.body;

    // const objectId  = req.body[0].objectId;

    try {
        const contactProperties = [
            'estado_decumentacion_docusign',
            'firstname',
            'lastname',
            'phone',
            'nombre_de_la_agencia',
            'website',
            'email',
            'cif_nif',
            'representante_legal',
            'address',
            'delegaci_n_barrio'
        ];

        const contactResponse = await hubspotClient.crm.contacts.basicApi.getById(
            objectId,
            contactProperties
        );

        console.log(contactResponse)
        const contact = contactResponse.properties;

        if (contact.estado_decumentacion_docusign !== 'Completada') {
            return res.status(400).json({
                message: 'No puede enviarse la información a BestFlat del cliente: ' + contact.firstName + ' ' + contact.lastName
            });
        }

        const dataToSend = {
            email: contact.email || undefined,
            nombre: (contact.firstname && contact.lastname) ? contact.firstname + ' ' + contact.lastname : undefined,
            denominacion_social: contact.nombre_de_la_agencia || undefined,
            cif: contact.cif_nif || undefined,
            representante_legal: contact.representante_legal || undefined,
            dni_representante: contact.dni_representante_legal || undefined,
            // agente: contact. || undefined,
            direccion: contact.address || undefined,
            delegacion: contact.delegaci_n_barrio || undefined,
            telefono: contact.phone || undefined,
            pagina_web: contact.website || undefined
        };
    
        // Eliminar propiedades con valor undefined
        Object.keys(dataToSend).forEach(key => {
            if (dataToSend[key] === undefined) {
                delete dataToSend[key];
            }
        });

        console.log(dataToSend)

        try {
            const externalApiResponse = await axios.post('https://www.bestflat.com/api/registrar-agencia', dataToSend, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'x-api-key': 'Mbhmjf3uE7vivbacf2Q3'
                }
            });

            res.status(200).json({
                message: 'Datos procesados correctamente',
                data: dataToSend
            });

        } catch (apiError) {
            console.error('Error al llamar a la API de BestFlat:', apiError);
            res.status(500).json({
                message: 'Error al enviar datos a BestFlat',
                error: apiError.message
            });
        }
    } catch (error) {
        console.error('Error detallado:', error);
        res.status(500).json({
            message: 'Error al procesar la solicitud',
            error: error.message
        });
    }
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
