export const handler = async (event) => {
    const managers = [
        { name: "Magdalena Illanes", email: "magdalena.illanes@umine.com", phone: "+56 9 6121 5298" },
        { name: "Ignacia Larrondo", email: "ignacia.larrondo@umine.com", phone: "+56 9 7707 0611" },
        { name: "Alfredo Gonzalez", email: "alfredo.gonzalez@umine.com", phone: "+56 9 6574 7395" },
        { name: "Alexis Escobar", email: "alexis.escobar@umine.com", phone: "+56 9 5668 0814" },
        { name: "Begoña Prenafeta", email: "begona.prenafeta@umine.com", phone: "+56 9 6170 4558" },
        { name: "Fernanda Ugarte", email: "fernanda.ugarte@umine.com", phone: "+56 9 4524 4145" },
        { name: "Gabriela Muñoz", email: "gabriela.munoz@umine.com", phone: "+56 9 5225 3503" },
        { name: "OP", email: "operaciones@umine.com", phone: "-" }
    ];

    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
        },
        body: JSON.stringify(managers),
    };
};
