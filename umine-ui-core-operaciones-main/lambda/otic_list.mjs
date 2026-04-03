export const handler = async (event) => {
    const otics = [
        { name: 'DIRECTO', desc: 'Facturación Directa' },
        { name: 'AGROCAP', desc: 'OTIC Agrocap' },
        { name: 'ALIANZA', desc: 'OTIC Alianza' },
        { name: 'ASIMET', desc: 'OTIC Asimet' },
        { name: 'BANOTIC', desc: 'OTIC Banotic' },
        { name: 'BIOBIO', desc: 'OTIC Bio Bio' },
        { name: 'CAMACOES', desc: 'OTIC Camacoes' },
        { name: 'CAPFRUTA', desc: 'OTIC Capfruta' },
        { name: 'CCC', desc: 'OTIC Cámara Chilena de la Construcción' },
        { name: 'CGC', desc: 'OTIC CGC' },
        { name: 'CHILEVINOS', desc: 'OTIC Chilevinos' },
        { name: 'CORFICAP', desc: 'OTIC Corficap' },
        { name: 'DEL COMERCIO', desc: 'OTIC Del Comercio' },
        { name: 'DIGITALIA', desc: 'OTIC Digitalia' },
        { name: 'FRANCO CHILENO', desc: 'OTIC Franco Chileno' },
        { name: 'INDUPAN', desc: 'OTIC Indupan' },
        { name: 'PROMAULE', desc: 'OTIC Promaule' },
        { name: 'SOFOFA', desc: 'OTIC Sofofa' },
        { name: 'UNION', desc: 'OTIC Unión' },
        { name: "O'HIGGINS", desc: "OTIC O'Higgins" },
        { name: 'PROACONCAGUA', desc: 'OTIC Proaconcagua' },
        { name: 'PROFORMA', desc: 'OTIC Proforma' }
    ];

    return {
        statusCode: 200,
        body: JSON.stringify(otics)
    };
};
